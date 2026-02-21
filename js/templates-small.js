const S = (rowStart, rowEnd, colStart, colEnd, prefer = 'any') =>
  ({ rowStart, rowEnd, colStart, colEnd, prefer });

export const TEMPLATES_SMALL = [
  { id: '1A', photoCount: 1, baseRows: 1, baseCols: 1,
    slots: [S(1,2,1,2)] },

  { id: '2H', photoCount: 2, baseRows: 1, baseCols: 2,
    slots: [S(1,2,1,2,'landscape'), S(1,2,2,3,'landscape')] },
  { id: '2V', photoCount: 2, baseRows: 2, baseCols: 1,
    slots: [S(1,2,1,2,'portrait'), S(2,3,1,2,'portrait')] },

  { id: '3T', photoCount: 3, baseRows: 2, baseCols: 2,
    slots: [S(1,2,1,3,'landscape'), S(2,3,1,2), S(2,3,2,3)] },
  { id: '3L', photoCount: 3, baseRows: 2, baseCols: 2,
    slots: [S(1,3,1,2,'portrait'), S(1,2,2,3), S(2,3,2,3)] },

  { id: '4G', photoCount: 4, baseRows: 2, baseCols: 2,
    slots: [S(1,2,1,2), S(1,2,2,3), S(2,3,1,2), S(2,3,2,3)] },
  { id: '4T', photoCount: 4, baseRows: 2, baseCols: 3,
    slots: [S(1,2,1,4,'landscape'), S(2,3,1,2,'portrait'), S(2,3,2,3,'portrait'), S(2,3,3,4,'portrait')] },
  { id: '4L', photoCount: 4, baseRows: 3, baseCols: 2,
    slots: [S(1,4,1,2,'portrait'), S(1,2,2,3,'landscape'), S(2,3,2,3,'landscape'), S(3,4,2,3,'landscape')] },

  { id: '5T', photoCount: 5, baseRows: 2, baseCols: 6,
    slots: [S(1,2,1,4,'landscape'), S(1,2,4,7,'landscape'), S(2,3,1,3), S(2,3,3,5), S(2,3,5,7)] },
  { id: '5L', photoCount: 5, baseRows: 2, baseCols: 3,
    slots: [S(1,3,1,2,'portrait'), S(1,2,2,3), S(1,2,3,4), S(2,3,2,3), S(2,3,3,4)] },
];
