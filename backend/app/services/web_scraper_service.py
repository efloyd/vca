import logging
import re
from urllib.parse import urljoin, urlparse
from typing import NamedTuple

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

MAX_PAGES = 50  # Limit child page crawling
MAX_DEPTH = 2   # How deep to crawl


class PageContent(NamedTuple):
    url: str
    title: str
    text: str


class WebScraperService:
    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "VCA-Bot/1.0 (Virtual Compliance Assistant)"
            },
        )

    async def close(self):
        await self._client.aclose()

    def _extract_text(self, html: str, url: str) -> PageContent:
        """Extract readable text from HTML."""
        soup = BeautifulSoup(html, "html.parser")

        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()

        # Get title
        title = soup.title.string if soup.title else urlparse(url).path

        # Get text
        text = soup.get_text(separator="\n", strip=True)

        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)

        return PageContent(url=url, title=title or url, text=text)

    def _get_same_domain_links(self, html: str, base_url: str) -> list[str]:
        """Extract links that belong to the same domain."""
        soup = BeautifulSoup(html, "html.parser")
        base_domain = urlparse(base_url).netloc

        links = set()
        for anchor in soup.find_all("a", href=True):
            href = anchor["href"]

            # Skip anchors, javascript, mailto, etc.
            if href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            # Resolve relative URLs
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)

            # Only same domain
            if parsed.netloc != base_domain:
                continue

            # Skip non-http(s)
            if parsed.scheme not in ("http", "https"):
                continue

            # Remove fragment
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if parsed.query:
                clean_url += f"?{parsed.query}"

            links.add(clean_url)

        return list(links)

    async def fetch_page(self, url: str) -> PageContent | None:
        """Fetch a single page and extract its content."""
        try:
            response = await self._client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "text/html" not in content_type:
                logger.warning(f"Skipping non-HTML content: {url}")
                return None

            return self._extract_text(response.text, url)

        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    async def crawl(self, start_url: str, include_children: bool = False) -> list[PageContent]:
        """Crawl a URL and optionally its child pages."""
        pages: list[PageContent] = []
        visited: set[str] = set()
        to_visit: list[tuple[str, int]] = [(start_url, 0)]  # (url, depth)

        while to_visit and len(pages) < MAX_PAGES:
            url, depth = to_visit.pop(0)

            if url in visited:
                continue
            visited.add(url)

            logger.info(f"Crawling: {url} (depth={depth})")

            try:
                response = await self._client.get(url)
                response.raise_for_status()

                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type:
                    continue

                html = response.text
                page_content = self._extract_text(html, url)

                if page_content.text:
                    pages.append(page_content)

                # Crawl children if enabled and not too deep
                if include_children and depth < MAX_DEPTH:
                    child_links = self._get_same_domain_links(html, url)
                    for link in child_links:
                        if link not in visited:
                            to_visit.append((link, depth + 1))

            except Exception as e:
                logger.error(f"Error crawling {url}: {e}")
                continue

        logger.info(f"Crawled {len(pages)} pages from {start_url}")
        return pages
