import React from 'react';
import { CinematicBrandLoader, type CinematicBrandLoaderProps } from './CinematicBrandLoader';

export type BrandLoaderProps = CinematicBrandLoaderProps;

/**
 * MARUDHAM OG MUSIC — Authentic Cinematic 3D Fragment Brand Loader
 * Standardizes all loader usage to the full-viewport cinematic logo assembly experience.
 */
export const BrandLoader: React.FC<BrandLoaderProps> = (props) => {
  return <CinematicBrandLoader {...props} />;
};
