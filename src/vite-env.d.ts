/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*?url' {
  const src: string;
  export default src;
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: any;
  export default vfs;
}
