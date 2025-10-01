import React, { useState } from 'react';
import { TextField, Box, IconButton, AppBar, Toolbar, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onMenuClick: () => void;
}

export function SearchBar({ onSearch, onMenuClick }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 3 }}>
          GraphQL Schema Visualizer
        </Typography>

        <Box sx={{ flexGrow: 1, maxWidth: 600 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search types..."
            value={query}
            onChange={handleChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              endAdornment: query && (
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            }}
            sx={{
              backgroundColor: 'white',
              borderRadius: 1,
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
