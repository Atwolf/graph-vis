import React from 'react';
import {
  Drawer,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { FilterState } from '../types/graph';

interface ControlsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  open: boolean;
  onClose: () => void;
}

export function Controls({ filters, onChange, open, onClose }: ControlsProps) {
  const handleChange = (key: keyof FilterState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      [key]: event.target.checked,
    });
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          pt: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Filters
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ px: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Relationships
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={filters.showFields} onChange={handleChange('showFields')} />}
            label={
              <Box>
                <Typography variant="body2">Field Edges</Typography>
                <Typography variant="caption" color="text.secondary">
                  Show type field relationships
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={<Switch checked={filters.showImplements} onChange={handleChange('showImplements')} />}
            label={
              <Box>
                <Typography variant="body2">Implements</Typography>
                <Typography variant="caption" color="text.secondary">
                  Show interface implementations
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={<Switch checked={filters.showUnions} onChange={handleChange('showUnions')} />}
            label={
              <Box>
                <Typography variant="body2">Union Members</Typography>
                <Typography variant="caption" color="text.secondary">
                  Show union type members
                </Typography>
              </Box>
            }
          />
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Node Visibility
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={filters.hideBuiltIns} onChange={handleChange('hideBuiltIns')} />}
            label={
              <Box>
                <Typography variant="body2">Hide Built-ins</Typography>
                <Typography variant="caption" color="text.secondary">
                  Hide String, Int, Boolean, etc.
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={<Switch checked={filters.hideRelay} onChange={handleChange('hideRelay')} />}
            label={
              <Box>
                <Typography variant="body2">Hide Relay Types</Typography>
                <Typography variant="caption" color="text.secondary">
                  Hide Connection, Edge, PageInfo
                </Typography>
              </Box>
            }
          />
        </FormGroup>
      </Box>
    </Drawer>
  );
}
