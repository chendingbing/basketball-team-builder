import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function TopPlayersDialog({ open, onClose, players }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        球员战力排行榜
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>排名</TableCell>
                <TableCell>球员</TableCell>
                <TableCell align="right">战力</TableCell>
                <TableCell align="right">得分</TableCell>
                <TableCell align="right">篮板</TableCell>
                <TableCell align="right">助攻</TableCell>
                <TableCell align="right">抢断</TableCell>
                <TableCell align="right">盖帽</TableCell>
                <TableCell align="right">失误</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player, index) => (
                <TableRow key={player.personId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell align="right">{player.Ability.toFixed(1)}</TableCell>
                  <TableCell align="right">{player.points}</TableCell>
                  <TableCell align="right">{player.rebounds}</TableCell>
                  <TableCell align="right">{player.assists}</TableCell>
                  <TableCell align="right">{player.steals}</TableCell>
                  <TableCell align="right">{player.blocks}</TableCell>
                  <TableCell align="right">{player.turnovers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
