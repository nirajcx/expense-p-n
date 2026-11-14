export function sendData(res, data, meta) {
  return res.status(200).json({ data, ...(meta ? { meta } : {}) });
}
