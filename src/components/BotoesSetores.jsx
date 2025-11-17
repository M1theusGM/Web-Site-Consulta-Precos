import React from "react";
import { Box, IconButton } from "@mui/material";

const BotoesSetores = ({
  src,
  alt,
  ratio = 3.25,
  borderRadius = 2,
  boxShadow = 3,
  fit = "contain",     
  imgScale = 0.9,      
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
