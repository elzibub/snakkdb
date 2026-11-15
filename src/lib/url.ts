const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const url = (path: string) => `${base}/${path.replace(/^\//, "")}`;

// Set REPO in the environment (the deploy workflow does) to get edit links.
export const REPO = import.meta.env.REPO ?? process.env.REPO ?? "OWNER/snakkdb";
export const editUrl = (id: string) =>
  `https://github.com/${REPO}/edit/main/snacks/${id}/index.md`;
export const newSnackUrl = () =>
  `https://github.com/${REPO}/issues/new?template=new-snack.yml`;
