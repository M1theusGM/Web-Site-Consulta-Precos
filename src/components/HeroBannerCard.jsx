import React from "react";
import { Box, Typography, Button, CardActionArea } from "@mui/material";

export default function HeroBannerCard({
  image,
  alt = "",
  title,
  subtitle,
  buttonText,
  onClick,
  sx = {},
  imgPosition = "50% 50%",   
  imgSx = {},               
}) {
  return (
    <CardActionArea
      onClick={onClick}
      sx={{ display: "block", width: "100%", borderRadius: 2, overflow: "hidden" }}
    >
      <Box sx={{ position: "relative", width: "100%", height: { xs: 160, sm: 220, md: 320 }, ...sx }}>
        <Box
          component="img"
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: imgPosition, 
            display: "block",
            ...imgSx,
          }}
        />

        {(title || subtitle || buttonText) && (
          <Box sx={{ position: "absolute", inset: 0, p: { xs: 2, sm: 3 }, color: "white", zIndex: 1, display: "flex", alignItems: "center" }}>
            <Box>
              {title && <Typography variant="h4" fontWeight="bold">{title}</Typography>}
              {subtitle && <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>{subtitle}</Typography>}
              {buttonText && <Button variant="contained" color="error" size="small" sx={{ mt: 2, borderRadius: 20 }}>{buttonText}</Button>}
            </Box>
          </Box>
        )}
      </Box>
    </CardActionArea>
  );
}
