import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayerSelectDialog from './components/PlayerSelectDialog';
import TopPlayersDialog from './components/TopPlayersDialog';
import config from './config';

function App() {
  const [lineups, setLineups] = useState(() => {
    const savedLineups = localStorage.getItem('lineups');
    return savedLineups ? JSON.parse(savedLineups) : [{ id: 1, name: '阵容 1', players: Array(5).fill(null) }];
  });
  const [currentLineupId, setCurrentLineupId] = useState(() => {
    const savedId = localStorage.getItem('currentLineupId');
    return savedId ? parseInt(savedId) : 1;
  });
  const [playerAbilities, setPlayerAbilities] = useState(() => {
    const savedAbilities = localStorage.getItem('playerAbilities');
    return savedAbilities ? JSON.parse(savedAbilities) : {};
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [topPlayersOpen, setTopPlayersOpen] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lineupToDelete, setLineupToDelete] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const currentLineup = lineups.find(l => l.id === currentLineupId) || lineups[0];
  const players = currentLineup.players;

  useEffect(() => {
    localStorage.setItem('lineups', JSON.stringify(lineups));
    localStorage.setItem('currentLineupId', currentLineupId);
    localStorage.setItem('playerAbilities', JSON.stringify(playerAbilities));
  }, [lineups, currentLineupId, playerAbilities]);

  const handleOpenDialog = () => {
    setSelectedPlayers(players.filter(p => p !== null));
    setDialogOpen(true);
  };

  const addNewLineup = () => {
    if (lineups.length >= 3) {
      alert('最多只能创建3个阵容');
      return;
    }
    const newId = Math.max(...lineups.map(l => l.id)) + 1;
    setLineups([...lineups, { 
      id: newId, 
      name: `阵容 ${newId}`,
      players: Array(5).fill(null)
    }]);
    setCurrentLineupId(newId);
  };

  const handlePlayersSelect = (selectedPlayers) => {
    const newPlayers = Array(5).fill(null);
    selectedPlayers.slice(0, 5).forEach((player, index) => {
      newPlayers[index] = player;
    });
    
    setLineups(prevLineups => prevLineups.map(lineup => 
      lineup.id === currentLineupId 
        ? { ...lineup, players: newPlayers }
        : lineup
    ));
    
    // 获取选中球员的战力数据
    if (selectedPlayers.length > 0) {
      fetchPlayerAbilities(selectedPlayers);
    } else {
      setPlayerAbilities({});
    }
  };

  const fetchPlayerAbilities = async (selectedPlayers) => {
    try {
      const personIds = selectedPlayers
        .filter(p => p !== null)
        .map(p => p.personId)
        .join(',');
      
      if (!personIds) return;

      console.log('Fetching abilities for players:', personIds);

      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.playerAbility}?personIds=${personIds}`,
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
      console.log('Received new abilities data:', data);
      
      if (data.success) {
        const abilitiesMap = {};
        data.data.forEach(player => {
          abilitiesMap[player.personId] = player.Ability;
        });
        console.log('Updated abilities map:', abilitiesMap);
        
        // 使用函数式更新
        setPlayerAbilities(prev => {
          const newAbilities = { ...prev };
          Object.keys(abilitiesMap).forEach(personId => {
            newAbilities[personId] = abilitiesMap[personId];
          });
          return newAbilities;
        });

        // 更新球员信息
        setLineups(prevLineups => prevLineups.map(lineup => 
          lineup.id === currentLineupId 
            ? { 
              ...lineup, 
              players: lineup.players.map(player => {
                if (!player) return null;
                const updatedPlayer = data.data.find(p => p.personId === player.personId);
                if (updatedPlayer) {
                  return {
                    ...player,
                    Ability: updatedPlayer.Ability
                  };
                }
                return player;
              })
            }
            : lineup
        ));
      }
    } catch (error) {
      console.error('获取球员战力失败:', error);
    }
  };

  const handleRefreshAbilities = async () => {
    console.log('Refreshing abilities...');
    console.log('Current players:', players);
    console.log('Current abilities:', playerAbilities);
    
    setRefreshing(true);
    const selectedPlayers = players.filter(p => p !== null);
    if (selectedPlayers.length > 0) {
      await fetchPlayerAbilities(selectedPlayers);
    }
    setRefreshing(false);
  };

  const handleTopPlayersClick = async () => {
    try {
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.topPlayers}`,
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
        setTopPlayers(data.data);
        setTopPlayersOpen(true);
      }
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      alert('获取排行榜数据失败，请稍后重试');
    }
  };

  const handleDeleteLineup = (lineup) => {
    if (lineups.length <= 1) {
      alert('无法删除最后一个阵容');
      return;
    }
    setLineupToDelete(lineup);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteLineup = () => {
    if (!lineupToDelete) return;

    const newLineups = lineups.filter(l => l.id !== lineupToDelete.id);
    setLineups(newLineups);
    
    // 如果删除的是当前阵容，切换到第一个阵容
    if (lineupToDelete.id === currentLineupId) {
      setCurrentLineupId(newLineups[0].id);
    }
    
    setDeleteConfirmOpen(false);
    setLineupToDelete(null);
  };

  const handleEyeSetClick = () => {
    setSnackbarOpen(true);
  };

  // 计算总战力
  const totalAbility = useMemo(() => {
    return players
      .filter(player => player !== null)
      .reduce((sum, player) => {
        const ability = playerAbilities[player.personId] || 0;
        return sum + ability;
      }, 0);
  }, [players, playerAbilities]);

  return (
    <Box sx={{ 
      height: '100dvh',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentLineup.name}
          </Typography>
          <IconButton 
            color="error" 
            size="small" 
            onClick={() => handleDeleteLineup(currentLineup)}
            sx={{ mr: 1 }}
          >
            <DeleteIcon />
          </IconButton>
          <Button color="inherit" size="small" onClick={addNewLineup}>
            添加阵容
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {lineups.map(lineup => (
            <Chip
              key={lineup.id}
              label={lineup.name}
              onClick={() => setCurrentLineupId(lineup.id)}
              color={currentLineupId === lineup.id ? "primary" : "default"}
              variant={currentLineupId === lineup.id ? "filled" : "outlined"}
            />
          ))}
        </Box>
      </Container>

      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 2, sm: 3 },
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 1, sm: 2 },
          mb: { xs: 7, sm: 8 },
        }}>
          {players.map((player, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                placeholder={`选择球员 ${index + 1}`}
                variant="outlined"
                size="small"
                value={player ? (player.ChineseName || player.name) : ''}
                onClick={handleOpenDialog}
                InputProps={{
                  readOnly: true,
                  sx: {
                    height: { xs: '40px', sm: '45px' },
                    cursor: 'pointer'
                  },
                  ...(player && (playerAbilities[player.personId] !== undefined) && {
                    endAdornment: (
                      <Chip 
                        label={`战力: ${playerAbilities[player.personId]?.toFixed(1) || '0.0'}`}
                        color="primary"
                        size="small"
                        sx={{ 
                          height: 24,
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    )
                  })
                }}
              />
            </Box>
          ))}

          {/* 总战力显示 */}
          <Paper 
            elevation={0} 
            variant="outlined"
            sx={{ 
              mt: 3,
              py: 2.5,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex',
                alignItems: 'center'
              }}
            >
              总战力
              <Typography 
                component="span" 
                variant="h5" 
                sx={{ 
                  ml: 2,
                  color: 'primary.main',
                  fontWeight: 600
                }}
              >
                {totalAbility.toFixed(1)}
              </Typography>
            </Typography>
            <IconButton 
              onClick={handleRefreshAbilities}
              disabled={refreshing || players.every(p => p === null)}
              size="small"
              color="primary"
              sx={{ 
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Paper>
        </Box>
      </Container>

      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: { xs: 1, sm: 2 },
          display: 'flex', 
          justifyContent: 'space-around',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Button variant="contained" color="success" sx={{ flex: 1, mx: 0.5 }} size="small" onClick={handleTopPlayersClick}>
          排行榜
        </Button>
        <Button variant="contained" color="info" sx={{ flex: 1, mx: 0.5 }} size="small" onClick={handleEyeSetClick}>
          天眼套
        </Button>
      </Box>

      <PlayerSelectDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handlePlayersSelect}
        selectedPlayers={selectedPlayers}
        maxPlayers={5}
      />

      <TopPlayersDialog
        open={topPlayersOpen}
        onClose={() => setTopPlayersOpen(false)}
        players={topPlayers}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>删除阵容</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除"{lineupToDelete?.name}"吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
          <Button onClick={confirmDeleteLineup} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          暂未开放
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
