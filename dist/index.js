"use strict";
/**
 * On-Chain Memory SDK
 *
 * Production-ready SDK for storing Cognee memories on Solana blockchain.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.IQLabsAPI = exports.LargeDataStorage = exports.SyncableMemoryIndex = exports.LocalMemoryIndex = exports.CogneeMemoryAdapter = void 0;
// Core adapter
var CogneeMemoryAdapter_1 = require("./adapters/CogneeMemoryAdapter");
Object.defineProperty(exports, "CogneeMemoryAdapter", { enumerable: true, get: function () { return CogneeMemoryAdapter_1.CogneeMemoryAdapter; } });
// Index system
var LocalMemoryIndex_1 = require("./index/LocalMemoryIndex");
Object.defineProperty(exports, "LocalMemoryIndex", { enumerable: true, get: function () { return LocalMemoryIndex_1.LocalMemoryIndex; } });
var SyncableMemoryIndex_1 = require("./index/SyncableMemoryIndex");
Object.defineProperty(exports, "SyncableMemoryIndex", { enumerable: true, get: function () { return SyncableMemoryIndex_1.SyncableMemoryIndex; } });
// Storage layer
var LargeDataStorage_1 = require("./storage/LargeDataStorage");
Object.defineProperty(exports, "LargeDataStorage", { enumerable: true, get: function () { return LargeDataStorage_1.LargeDataStorage; } });
var IQLabsAPI_1 = require("./api/IQLabsAPI");
Object.defineProperty(exports, "IQLabsAPI", { enumerable: true, get: function () { return IQLabsAPI_1.IQLabsAPI; } });
// Version
exports.VERSION = '1.0.0';
//# sourceMappingURL=index.js.map