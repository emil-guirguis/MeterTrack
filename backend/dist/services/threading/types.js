/**
 * Threading types and interfaces for MCP server threading
 */
/**
 * Message priority levels
 */
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["LOW"] = 0] = "LOW";
    MessagePriority[MessagePriority["NORMAL"] = 1] = "NORMAL";
    MessagePriority[MessagePriority["HIGH"] = 2] = "HIGH";
    MessagePriority[MessagePriority["CRITICAL"] = 3] = "CRITICAL";
})(MessagePriority || (MessagePriority = {}));
//# sourceMappingURL=types.js.map