import React from "react";
import { Box, IconButton } from "@mui/material";

/**
 * Botão de setor responsivo
 * - Largura 100% do grid item
 * - Altura por aspect-ratio (padrão ≈ 293x90 = 3.25:1)
 * - Imagem centralizada; "contain" evita cortes de arte
 */
const BotoesSetores = ({
  src,
  alt,
  ratio = 3.25,
  borderRadius = 2,
  boxShadow = 3,
  fit = "contain",     // "contain" (recomendado) ou "cover"
  imgScale = 0.9,      // 0.9 = 90% da área útil (respiro)
  sx,
  imgSx,
  ...props
}) => {
  return (
    <IconButton
      disableRipple
      {...props}
      sx={{
        p: 0,
        width: '100%',
        aspectRatio: ratio,
        borderRadius,
        boxShadow,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        display: 'grid',
        placeItems: 'center',   // centraliza conteúdo
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        sx={{
          width: `${imgScale * 120}%`,
          height: `${imgScale * 120}%`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: fit,
          objectPosition: 'center',
          display: 'block',
          ...imgSx,
        }}
      />
    </IconButton>
  );
};

export default BotoesSetores;
