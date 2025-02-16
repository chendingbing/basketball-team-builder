import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Button,
  Checkbox,
  Typography,
  Alert,
  Chip,
  Divider,
  InputLabel,
  Avatar
} from '@mui/material';
import config from '../config';

const PlayerSelectDialog = ({ open, onClose, onSelect, selectedPlayers = [], maxPlayers = 5 }) => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localSelectedPlayers, setLocalSelectedPlayers] = useState([]);

  // 初始化本地选中状态
  useEffect(() => {
    if (open) {
      setLocalSelectedPlayers(selectedPlayers);
    }
  }, [open, selectedPlayers]);

  // 获取球队列表
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.todayGames}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          const allTeams = [
            ...data.data.map(game => game.homeTeam),
            ...data.data.map(game => game.awayTeam)
          ];
          const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.teamId, team])).values());
          setTeams(uniqueTeams);
          if (uniqueTeams.length > 0 && !selectedTeam) {
            setSelectedTeam(uniqueTeams[0]);
          }
        }
      } catch (error) {
        console.error('获取球队列表失败:', error);
      }
    };

    if (open) {
      fetchTeams();
    }
  }, [open, selectedTeam]);

  // 获取球员列表
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedTeam) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${config.api.baseUrl}${config.api.endpoints.teamPlayers.replace('{teamId}', selectedTeam.teamId)}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setPlayers(data.data);
        }
      } catch (error) {
        console.error('获取球员列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedTeam) {
      fetchPlayers();
    }
  }, [selectedTeam]);

  const handleTeamChange = (event) => {
    const team = teams.find(t => t.teamId === event.target.value);
    setSelectedTeam(team);
  };

  const handlePlayerToggle = (player) => {
    setLocalSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.personId === player.personId);
      if (isSelected) {
        return prev.filter(p => p.personId !== player.personId);
      } else {
        if (prev.length >= maxPlayers) {
          return prev;
        }
        return [...prev, player];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(localSelectedPlayers);
    onClose();
  };

  const isPlayerSelected = (player) => {
    return localSelectedPlayers.some(p => p.personId === player.personId);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Typography variant="h6" component="span">
          选择球员
        </Typography>
        <Chip 
          label={`${localSelectedPlayers.length}/${maxPlayers}`}
          size="small"
          color="default"
          sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
          {/* 已选球员展示区 */}
          {localSelectedPlayers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                已选择的球员
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {localSelectedPlayers.map((player) => (
                  <Chip
                    key={player.personId}
                    label={player.ChineseName || player.name}
                    onDelete={() => handlePlayerToggle(player)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 球队选择下拉框 */}
          <FormControl variant="outlined" size="small" sx={{ mb: 2 }}>
            <Select
              value={selectedTeam?.teamId || ''}
              onChange={handleTeamChange}
              size="small"
              displayEmpty
            >
              {teams.map((team) => (
                <MenuItem key={team.teamId} value={team.teamId}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {localSelectedPlayers.length >= maxPlayers && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              已达到最大选择数量 ({maxPlayers})
            </Alert>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* 球员列表区域 */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List 
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider'
              }}
            >
              {players.map((player) => (
                <ListItem 
                  key={player.personId} 
                  disablePadding
                  divider
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={isPlayerSelected(player)}
                      disabled={!isPlayerSelected(player) && localSelectedPlayers.length >= maxPlayers}
                      sx={{
                        color: 'primary.main',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                >
                  <ListItemButton 
                    onClick={() => handlePlayerToggle(player)}
                    disabled={!isPlayerSelected(player) && localSelectedPlayers.length >= maxPlayers}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.6,
                      },
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 2,
                        bgcolor: isPlayerSelected(player) ? 'primary.main' : 'grey.300'
                      }}
                    >
                      {(player.ChineseName || player.name).charAt(0)}
                    </Avatar>
                    <ListItemText 
                      primary={player.ChineseName || player.name}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isPlayerSelected(player) ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
          size="large"
          sx={{ minWidth: 100 }}
        >
          取消
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="primary" 
          variant="contained"
          size="large"
          sx={{ minWidth: 100 }}
        >
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerSelectDialog;
