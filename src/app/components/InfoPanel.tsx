import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CustomReactFlowNode } from '../types/graph';
import { getTypeColor } from '../utils/colors';

interface InfoPanelProps {
  node: CustomReactFlowNode | null;
  onClose: () => void;
  incomingCount?: number;
  outgoingCount?: number;
}

export function InfoPanel({ node, onClose, incomingCount = 0, outgoingCount = 0 }: InfoPanelProps) {
  if (!node) return null;

  const typeColor = getTypeColor(node.data.kind);

  return (
    <Drawer
      anchor="right"
      open={!!node}
      onClose={onClose}
      sx={{
        width: 360,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 360,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Type Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: typeColor }}>
              {node.data.label}
            </Typography>
            <Chip
              label={node.data.kind}
              size="small"
              sx={{
                backgroundColor: typeColor,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>

          {node.data.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {node.data.description}
            </Typography>
          )}

          {node.data.isRelay && (
            <Chip
              label="Relay Type"
              size="small"
              color="info"
              sx={{ mt: 1, mr: 0.5 }}
            />
          )}

          {node.data.isBuiltIn && (
            <Chip
              label="Built-in Type"
              size="small"
              color="default"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <Divider />

        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Connections
          </Typography>
          <Box display="flex" gap={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {incomingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Incoming
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {outgoingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outgoing
              </Typography>
            </Box>
          </Box>
        </Box>

        {node.data.fields && node.data.fields.length > 0 && (
          <>
            <Divider />
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fields ({node.data.fields.length})
              </Typography>
              <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                {node.data.fields.map((field, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {field.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {field.typeName}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
