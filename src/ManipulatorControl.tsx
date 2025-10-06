import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid
} from '@mui/material';
import { PlayArrow, Logout } from '@mui/icons-material';

// Типы
interface Position {
  x: number;
  y: number;
}

interface Sample {
  id: number;
  position: Position;
}

interface HistoryRecord {
  id: number;
  original: string;
  optimized: string;
  date: string;
  time: string;
  samplesBefore: Sample[];
  samplesAfter: Sample[];
}

// Компонент авторизации
const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Неверные учетные данные');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Вход в систему
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            error={!!error}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            error={!!error}
            helperText={error}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{ mt: 2 }}
          >
            Войти
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

// Функция оптимизации команд
const optimizeCommands = (commands: string): string => {
  let result = commands;
  
  // Сжатие повторяющихся команд
  result = result.replace(/(.)\1+/g, (match, char) => `${match.length}${char}`);
  
  // Поиск повторяющихся паттернов
  const findRepeatingPattern = (str: string): string => {
    for (let len = 1; len <= str.length / 2; len++) {
      let pattern = str.substring(0, len);
      let count = 1;
      let pos = len;
      
      while (pos + len <= str.length && str.substring(pos, pos + len) === pattern) {
        count++;
        pos += len;
      }
      
      if (count >= 2 && pos === str.length) {
        return `${count}(${pattern})`;
      }
    }
    return str;
  };
  
  // Применяем поиск паттернов
  const segments = result.split(/([ОБ])/);
  result = segments.map(seg => {
    if (seg === 'О' || seg === 'Б' || seg === '') return seg;
    return findRepeatingPattern(seg);
  }).join('');
  
  return result;
};

// Основное приложение
const ManipulatorControl = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commands, setCommands] = useState('');
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [holdingSample, setHoldingSample] = useState<number | null>(null);
  const [historyDialog, setHistoryDialog] = useState(false);

  const gridSize = 8;

  // Генерация образцов
  useEffect(() => {
    if (isLoggedIn && samples.length === 0) {
      const newSamples: Sample[] = [];
      for (let i = 0; i < 3; i++) {
        newSamples.push({
          id: i + 1,
          position: {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
          }
        });
      }
      setSamples(newSamples);
    }
  }, [isLoggedIn]);

  // Выполнение команд
  const executeCommands = async () => {
    const optimized = optimizeCommands(commands);
    const samplesBefore = JSON.parse(JSON.stringify(samples));
    
    setIsAnimating(true);
    let currentPos = { x: 0, y: 0 };
    setPosition(currentPos);
    let holding: number | null = null;
    
    // Парсинг и выполнение команд
    const expandCommands = (cmd: string): string[] => {
      const result: string[] = [];
      let i = 0;
      
      while (i < cmd.length) {
        if (/\d/.test(cmd[i])) {
          let num = '';
          while (i < cmd.length && /\d/.test(cmd[i])) {
            num += cmd[i];
            i++;
          }
          
          if (cmd[i] === '(') {
            let depth = 1;
            let pattern = '';
            i++;
            while (i < cmd.length && depth > 0) {
              if (cmd[i] === '(') depth++;
              if (cmd[i] === ')') depth--;
              if (depth > 0) pattern += cmd[i];
              i++;
            }
            const expanded = expandCommands(pattern);
            for (let j = 0; j < parseInt(num); j++) {
              result.push(...expanded);
            }
          } else {
            for (let j = 0; j < parseInt(num); j++) {
              result.push(cmd[i]);
            }
            i++;
          }
        } else {
          result.push(cmd[i]);
          i++;
        }
      }
      
      return result;
    };
    
    const cmdArray = expandCommands(optimized);
    
    for (const cmd of cmdArray) {
      await new Promise(resolve => setTimeout(resolve, speed));
      
      switch (cmd) {
        case 'Л':
          currentPos.x = Math.max(0, currentPos.x - 1);
          break;
        case 'П':
          currentPos.x = Math.min(gridSize - 1, currentPos.x + 1);
          break;
        case 'В':
          currentPos.y = Math.max(0, currentPos.y - 1);
          break;
        case 'Н':
          currentPos.y = Math.min(gridSize - 1, currentPos.y + 1);
          break;
        case 'О':
          const sample = samples.find(s => 
            s.position.x === currentPos.x && s.position.y === currentPos.y
          );
          if (sample) {
            holding = sample.id;
            setHoldingSample(holding);
          }
          break;
        case 'Б':
          if (holding !== null) {
            setSamples(prev => prev.map(s => 
              s.id === holding ? { ...s, position: { ...currentPos } } : s
            ));
            holding = null;
            setHoldingSample(null);
          }
          break;
      }
      
      setPosition({ ...currentPos });
    }
    
    setIsAnimating(false);
    
    const now = new Date();
    const newRecord: HistoryRecord = {
      id: Date.now(),
      original: commands,
      optimized,
      date: now.toLocaleDateString('ru-RU'),
      time: now.toLocaleTimeString('ru-RU'),
      samplesBefore,
      samplesAfter: JSON.parse(JSON.stringify(samples))
    };
    
    setHistory(prev => [newRecord, ...prev]);
    setSnackbar({ open: true, message: 'Операция выполнена успешно!' });
    setCommands('');
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Управление манипулятором</Typography>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={() => setIsLoggedIn(false)}
        >
          Выйти
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ввод команд
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={commands}
              onChange={(e) => setCommands(e.target.value.toUpperCase())}
              placeholder="Л, П, В, Н, О, Б"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Оптимизированная: {optimizeCommands(commands)}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Скорость анимации: {speed}ms
              </Typography>
              <Slider
                value={speed}
                onChange={(_, val) => setSpeed(val as number)}
                min={100}
                max={1000}
                step={50}
                disabled={isAnimating}
              />
            </Box>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={executeCommands}
              disabled={isAnimating || !commands}
              sx={{ mt: 2 }}
            >
              Выполнить
            </Button>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">История</Typography>
              <Button onClick={() => setHistoryDialog(true)}>
                Подробнее
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Время</TableCell>
                    <TableCell>Исходная</TableCell>
                    <TableCell>Оптимизированная</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.slice(0, 5).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>{record.original}</TableCell>
                      <TableCell>{record.optimized}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Визуализация стола
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gap: 1,
                aspectRatio: '1',
                bgcolor: '#e0e0e0',
                p: 2,
                borderRadius: 2
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                const isManipulator = position.x === x && position.y === y;
                const sample = samples.find(s => s.position.x === x && s.position.y === y);
                const isHeld = sample && holdingSample === sample.id;

                return (
                  <Box
                    key={idx}
                    sx={{
                      bgcolor: isManipulator ? '#2196f3' : '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isManipulator && (
                      <Box
                        sx={{
                          width: '60%',
                          height: '60%',
                          bgcolor: '#1976d2',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {holdingSample && (
                          <Box
                            sx={{
                              width: '50%',
                              height: '50%',
                              bgcolor: '#ff9800',
                              borderRadius: '50%'
                            }}
                          />
                        )}
                      </Box>
                    )}
                    {sample && !isHeld && (
                      <Box
                        sx={{
                          width: '50%',
                          height: '50%',
                          bgcolor: '#ff9800',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Chip label="Манипулятор" sx={{ bgcolor: '#2196f3', color: 'white' }} />
              <Chip label="Образец" sx={{ bgcolor: '#ff9800', color: 'white' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={historyDialog}
        onClose={() => setHistoryDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Полная история операций</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Время</TableCell>
                  <TableCell>Исходная команда</TableCell>
                  <TableCell>Оптимизированная</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>{record.original}</TableCell>
                    <TableCell>{record.optimized}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="success" variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManipulatorControl;