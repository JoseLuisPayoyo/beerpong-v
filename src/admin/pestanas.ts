// Las pestañas del panel. Añadir una = añadir una entrada aquí + su componente.
//
// - id: va en la URL (#id) y no debe cambiar.
// - Icono: un componente de ./iconos.
// - Componente: el contenido de la pestaña (pinta su propia CabeceraSeccion).
// - useContador (opcional): hook con el número de la barra lateral (null = sin número).
// - iniciar (opcional): se llama al entrar al panel y devuelve cómo pararlo. Sirve
//   para que los datos (y Realtime) vivan aunque se esté en otra pestaña.
import type { ComponentType } from 'react';
import type { PropsIcono } from './iconos';
import { IconoSugerencias } from './iconos';
import Sugerencias from './sugerencias/Sugerencias';
import { iniciar as iniciarSugerencias, useNuevas } from './sugerencias/store';

export interface Pestana {
  id: string;
  etiqueta: string;
  Icono: ComponentType<PropsIcono>;
  Componente: ComponentType;
  useContador?: () => number | null;
  // texto para lectores de pantalla junto al número: «3 nuevas»
  contadorEtiqueta?: (n: number) => string;
  iniciar?: () => () => void;
}

export const PESTANAS: Pestana[] = [
  {
    id: 'sugerencias',
    etiqueta: 'Sugerencias',
    Icono: IconoSugerencias,
    Componente: Sugerencias,
    useContador: useNuevas,
    contadorEtiqueta: (n) => (n === 1 ? '1 nueva' : `${n} nuevas`),
    iniciar: iniciarSugerencias,
  },
];
