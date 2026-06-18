// WeddinAI tema paletleri. "sampanya" varsayılan marka teması (data-theme yok →
// globals.css :root). Diğerleri <html data-theme="..."> ile override'ları tetikler.

export type TemaId = "sampanya" | "altin" | "turkuaz" | "zumrut" | "gul" | "gece";

export interface Tema {
  id: TemaId;
  ad: string;
  /** Seçicideki yuvarlağın gradyanı (paletin özeti) */
  nokta: string;
}

export const TEMALAR: Tema[] = [
  { id: "sampanya", ad: "Şampanya", nokta: "linear-gradient(135deg,#e3c98f,#c19a53)" },
  { id: "altin", ad: "Altın", nokta: "linear-gradient(135deg,#c9a36a,#9c7740)" },
  { id: "gul", ad: "Pudra Gül", nokta: "linear-gradient(135deg,#e08e92,#a8525a)" },
  { id: "turkuaz", ad: "Turkuaz", nokta: "linear-gradient(135deg,#1fc8c0,#0a6e74)" },
  { id: "zumrut", ad: "Zümrüt", nokta: "linear-gradient(135deg,#1ba86f,#0a5e3d)" },
  { id: "gece", ad: "Gece Mavisi", nokta: "linear-gradient(135deg,#5570e8,#2b3f9e)" },
];

export const VARSAYILAN_TEMA: TemaId = "sampanya";
export const TEMA_DEPO_ANAHTARI = "tema";

/** SSR öncesi flash'ı önleyen, <head>'e gömülen senkron script. */
export const TEMA_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('${TEMA_DEPO_ANAHTARI}');if(t&&t!=='${VARSAYILAN_TEMA}'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
