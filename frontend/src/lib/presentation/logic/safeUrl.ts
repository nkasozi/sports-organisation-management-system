import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  parse_http_url_value,
  parse_optional_media_url_value,
} from "$lib/core/types/UrlScalars";

const BLOB_URL_PROTOCOL = "blob:";
const STRING_TYPE_NAME = "string";
const CSS_URL_BREAKING_CHARACTER_PATTERN = /["'()\\\s]/g;

function normalize_url_input(raw_value: string): string {
  return typeof raw_value === STRING_TYPE_NAME ? raw_value.trim() : "";
}

function is_safe_blob_url(normalized_value: string): boolean {
  if (!normalized_value.toLowerCase().startsWith(BLOB_URL_PROTOCOL)) {
    return false;
  }
  const inner_url = normalized_value.slice(BLOB_URL_PROTOCOL.length);
  return parse_http_url_value(inner_url).success;
}

export function to_safe_link_url(raw_value: string): Option<string> {
  const normalized_value = normalize_url_input(raw_value);
  const parse_result = parse_http_url_value(normalized_value);
  return parse_result.success
    ? create_some_option<string>(parse_result.data)
    : create_none_option<string>();
}

export function to_safe_image_source(raw_value: string): Option<string> {
  const normalized_value = normalize_url_input(raw_value);
  if (normalized_value.length === 0) return create_none_option<string>();
  if (is_safe_blob_url(normalized_value)) {
    return create_some_option(normalized_value);
  }
  const parse_result = parse_optional_media_url_value(normalized_value);
  return parse_result.success
    ? create_some_option<string>(parse_result.data)
    : create_none_option<string>();
}

function encode_css_url_breaking_characters(source: string): string {
  return source.replace(
    CSS_URL_BREAKING_CHARACTER_PATTERN,
    (character: string) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
}

export function to_safe_css_url(raw_value: string): Option<string> {
  const safe_source = to_safe_image_source(raw_value);
  return safe_source.status === OptionStatus.SOME
    ? create_some_option(
        `url("${encode_css_url_breaking_characters(safe_source.value)}")`,
      )
    : create_none_option<string>();
}

export function filter_links_with_safe_urls<TLink extends { url: string }>(
  links: TLink[],
): TLink[] {
  return links.flatMap((link: TLink): TLink[] => {
    const safe_url = to_safe_link_url(link.url);
    return safe_url.status === OptionStatus.SOME
      ? [{ ...link, url: safe_url.value }]
      : [];
  });
}
