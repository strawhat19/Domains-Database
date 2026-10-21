import { Buffer } from 'node:buffer';
import { inflateRawSync } from 'node:zlib';
import { MAX_AUCTION_IMPORT_BYTES } from '../../shared/domainAuction/import';

export const MAX_AUCTION_ARCHIVE_BYTES = 2 * 1024 * 1024;
const invalidArchive = () => new Error(`Auction Inventory Archive Is Invalid`);
const checksumTable = Array.from({ length: 256 }, (_, byte) => {
  let value = byte;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

const checksum = (bytes: Uint8Array) => {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ checksumTable[(value ^ byte) & 0xff];
  return (value ^ 0xffffffff) >>> 0;
};

const checkExtraFields = (bytes: Buffer) => {
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length) throw invalidArchive();
    const id = bytes.readUInt16LE(offset);
    const length = bytes.readUInt16LE(offset + 2);
    if (id === 0x0001 || offset + 4 + length > bytes.length) throw invalidArchive();
    offset += 4 + length;
  }
};

// Read a single bounded JSON member in memory; no archive paths reach the filesystem.
export const readAuctionInventoryZip = (input: Uint8Array): string => {
  const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (bytes.length < 22 || bytes.length > MAX_AUCTION_ARCHIVE_BYTES) throw invalidArchive();
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 22 - 65_535); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50 && offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length) {
      end = offset;
      break;
    }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) !== 0 || bytes.readUInt16LE(end + 6) !== 0
    || bytes.readUInt16LE(end + 8) !== 1 || bytes.readUInt16LE(end + 10) !== 1) throw invalidArchive();
  const centralSize = bytes.readUInt32LE(end + 12);
  const centralOffset = bytes.readUInt32LE(end + 16);
  if (centralSize < 46 || centralOffset + centralSize !== end
    || centralOffset + 46 > end || bytes.readUInt32LE(centralOffset) !== 0x02014b50) throw invalidArchive();
  const flags = bytes.readUInt16LE(centralOffset + 8);
  const method = bytes.readUInt16LE(centralOffset + 10);
  const crc = bytes.readUInt32LE(centralOffset + 16);
  const compressedSize = bytes.readUInt32LE(centralOffset + 20);
  const expandedSize = bytes.readUInt32LE(centralOffset + 24);
  const nameLength = bytes.readUInt16LE(centralOffset + 28);
  const extraLength = bytes.readUInt16LE(centralOffset + 30);
  const commentLength = bytes.readUInt16LE(centralOffset + 32);
  const localOffset = bytes.readUInt32LE(centralOffset + 42);
  if (bytes.readUInt16LE(centralOffset + 6) > 20 || flags & ~0x080e || ![0, 8].includes(method)
    || bytes.readUInt16LE(centralOffset + 34) !== 0 || localOffset !== 0
    || !compressedSize || compressedSize > MAX_AUCTION_ARCHIVE_BYTES
    || !expandedSize || expandedSize > MAX_AUCTION_IMPORT_BYTES
    || centralSize !== 46 + nameLength + extraLength + commentLength) throw invalidArchive();
  const nameStart = centralOffset + 46;
  const name = bytes.subarray(nameStart, nameStart + nameLength);
  const filename = new TextDecoder(`utf-8`, { fatal: true }).decode(name);
  if (!/^[a-z0-9][a-z0-9_.-]*\.json$/i.test(filename)) throw invalidArchive();
  checkExtraFields(bytes.subarray(nameStart + nameLength, nameStart + nameLength + extraLength));
  if (centralOffset < 30 || bytes.readUInt32LE(0) !== 0x04034b50
    || bytes.readUInt16LE(4) > 20 || bytes.readUInt16LE(6) !== flags || bytes.readUInt16LE(8) !== method) throw invalidArchive();
  const localNameLength = bytes.readUInt16LE(26);
  const localExtraLength = bytes.readUInt16LE(28);
  const dataOffset = 30 + localNameLength + localExtraLength;
  const dataEnd = dataOffset + compressedSize;
  if (dataEnd > centralOffset || localNameLength !== nameLength
    || !bytes.subarray(30, 30 + localNameLength).equals(name)) throw invalidArchive();
  checkExtraFields(bytes.subarray(30 + localNameLength, dataOffset));
  const descriptor = Boolean(flags & 0x0008);
  for (const [offset, expected] of [[14, crc], [18, compressedSize], [22, expandedSize]]) {
    const actual = bytes.readUInt32LE(offset);
    if (actual !== expected && (!descriptor || actual !== 0)) throw invalidArchive();
  }
  if (descriptor) {
    const length = centralOffset - dataEnd;
    const hasSignature = length === 16 && bytes.readUInt32LE(dataEnd) === 0x08074b50;
    if (length !== 12 && !hasSignature) throw invalidArchive();
    const offset = dataEnd + (hasSignature ? 4 : 0);
    if (bytes.readUInt32LE(offset) !== crc || bytes.readUInt32LE(offset + 4) !== compressedSize
      || bytes.readUInt32LE(offset + 8) !== expandedSize) throw invalidArchive();
  } else if (dataEnd !== centralOffset) throw invalidArchive();
  const compressed = bytes.subarray(dataOffset, dataEnd);
  const expanded = method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: MAX_AUCTION_IMPORT_BYTES });
  if (expanded.length !== expandedSize || checksum(expanded) !== crc) throw invalidArchive();
  return new TextDecoder(`utf-8`, { fatal: true }).decode(expanded);
};
