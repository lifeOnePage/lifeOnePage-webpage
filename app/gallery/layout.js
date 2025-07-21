import { UnsavedChangesProvider } from "../contexts/UnsavedChangesContext";

export default function GalleryPageLayout({ children }) {
  return (
    <UnsavedChangesProvider>
      {children}
    </UnsavedChangesProvider>
  );
}
