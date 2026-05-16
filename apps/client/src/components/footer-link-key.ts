export interface FooterLinkKeyInput {
  external?: boolean;
  href: string;
  label: string;
}

export const getFooterLinkKey = (
  columnTitle: string,
  link: FooterLinkKeyInput,
  index: number
) => {
  const linkType = link.external ? "external" : "internal";
  return `${columnTitle}-${link.label}-${link.href}-${linkType}-${index}`;
};
