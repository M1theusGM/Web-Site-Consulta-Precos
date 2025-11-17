import React from "react";
import {
  Container,
  Box,
  Stack,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useLocation } from "react-router-dom";

export default function PriceHistory() {
  // Pegamos os dados que normalmente vêm da navegação (state)
  const { state } = useLocation();
  const initial = state?.initial || state?.product || null;
  const history = Array.isArray(state?.history) ? state.history : [];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            {initial?.nome || initial?.descricao || "Produto"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {initial?.departamento || "—"}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Histórico de Preços
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell align="right">Preço Original</TableCell>
              <TableCell align="right">Preço Promocional</TableCell>
              <TableCell align="right">Preço Exibido</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {history.length > 0 ? (
              history.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row?.data || row?.date || "—"}</TableCell>
                  <TableCell align="right">
                    {formatBRL(
                      row?.precoOriginal ?? row?.preco ?? row?.price
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatBRL(
                      row?.precoPromocional ?? row?.precoPromo ?? row?.promo
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatBRL(
                      row?.precoExibido ?? row?.precoFinal ?? row?.final
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Sem histórico disponível.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Container>
  );
}

function formatBRL(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
