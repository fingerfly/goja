const S = (rowStart, rowEnd, colStart, colEnd, prefer = 'any') =>
  ({ rowStart, rowEnd, colStart, colEnd, prefer });

export const TEMPLATES_LARGE = [
  { id: '6H', photoCount: 6, baseRows: 2, baseCols: 3,
    slots: [S(1,2,1,2), S(1,2,2,3), S(1,2,3,4), S(2,3,1,2), S(2,3,2,3), S(2,3,3,4)] },
  { id: '6V', photoCount: 6, baseRows: 3, baseCols: 2,
    slots: [S(1,2,1,2), S(1,2,2,3), S(2,3,1,2), S(2,3,2,3), S(3,4,1,2), S(3,4,2,3)] },

  { id: '7T', photoCount: 7, baseRows: 3, baseCols: 3, slots: [
    S(1,2,1,4,'landscape'),
    S(2,3,1,2), S(2,3,2,3), S(2,3,3,4),
    S(3,4,1,2), S(3,4,2,3), S(3,4,3,4),
  ]},

  { id: '8T', photoCount: 8, baseRows: 4, baseCols: 6, slots: [
    S(1,3,1,4,'landscape'), S(1,3,4,7,'landscape'),
    S(3,5,1,2), S(3,5,2,3), S(3,5,3,4),
    S(3,5,4,5), S(3,5,5,6), S(3,5,6,7),
  ]},

  { id: '9G', photoCount: 9, baseRows: 3, baseCols: 3, slots: [
    S(1,2,1,2), S(1,2,2,3), S(1,2,3,4),
    S(2,3,1,2), S(2,3,2,3), S(2,3,3,4),
    S(3,4,1,2), S(3,4,2,3), S(3,4,3,4),
  ]},
];
