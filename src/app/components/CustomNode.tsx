import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { CustomReactFlowNode } from '../types/graph';
import { getTypeColor } from '../utils/colors';

interface CustomNodeProps {
  data: CustomReactFlowNode['data'];
  selected?: boolean;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const typeColor = getTypeColor(data.kind);
  const maxFieldsToShow = 3;

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card
        sx={{
          minWidth: 180,
          maxWidth: 280,
          border: selected ? `2px solid ${typeColor}` : '1px solid #e0e0e0',
          borderRadius: 2,
          boxShadow: selected ? 4 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{
                color: typeColor,
                fontSize: '0.875rem',
                wordBreak: 'break-word',
              }}
            >
              {data.label}
            </Typography>
            <Chip
              label={data.kind}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: typeColor,
                color: 'white',
                ml: 0.5,
                fontWeight: 'bold',
              }}
            />
          </Box>

          {data.fields && data.fields.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {data.fields.slice(0, maxFieldsToShow).map((field, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  display="block"
                  sx={{
                    color: '#666',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {field.name}: {field.typeName}
                </Typography>
              ))}
              {data.fields.length > maxFieldsToShow && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#999',
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                  }}
                >
                  +{data.fields.length - maxFieldsToShow} more
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
