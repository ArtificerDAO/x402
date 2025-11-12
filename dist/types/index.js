"use strict";
/**
 * Type definitions for on-chain memory system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryType = exports.StorageType = void 0;
/**
 * Storage strategy for data
 */
var StorageType;
(function (StorageType) {
    StorageType["INLINE"] = "inline";
    StorageType["PINOCCHIO"] = "pinocchio";
})(StorageType || (exports.StorageType = StorageType = {}));
/**
 * Memory types for AI agents
 */
var MemoryType;
(function (MemoryType) {
    MemoryType["EPISODIC"] = "episodic";
    MemoryType["SEMANTIC"] = "semantic";
    MemoryType["PROCEDURAL"] = "procedural";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
//# sourceMappingURL=index.js.map