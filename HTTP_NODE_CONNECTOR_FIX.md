# HTTP Node Connector Selection Bug Fix

## Problem Description

When selecting a connector for an HTTP node, sometimes the UI would incorrectly show "Traditional" as selected instead of "Connector", even though a connector was actually selected.

## Root Cause

The issue was a **race condition** in the `useEffect` hook that determines the HTTP node mode (traditional vs connector):

1. When a connector is selected, `handleConnectorSelect` updates:

   - Local `config` state with `connector_id`
   - Store via `setNodes(updatedNodes)`
   - Mode to `'connector'`

2. The `useEffect` hook (line 730/609) watches for changes in `node?.data?.config?.connector_id`

3. **The Problem**: When `setNodes` is called, the store update is asynchronous. The `node` object comes from `flow.nodes.find((n) => n.id === selection)`, which might not be updated immediately.

4. **The Bug**: The `useEffect` would run and check `nodeConfig.connector_id`, but if the store hadn't updated yet, it would see `undefined` and incorrectly switch back to `'traditional'` mode.

## Solution

The fix checks **both** the node config from the store AND the local config state to handle async updates:

### Key Changes:

1. **Check both sources**:

   ```javascript
   const hasConnectorId = !!(nodeConfig.connector_id || config.connector_id);
   ```

2. **Avoid unnecessary mode switches**:

   ```javascript
   if (node.type === "http" && hasConnectorId) {
     // Only switch mode if it's not already in connector mode (avoid flickering)
     if (httpMode !== "connector") {
       setHttpMode("connector");
     }
   }
   ```

3. **More careful conditional logic**:

   - Only switch to traditional if currently in connector mode AND no connector_id exists
   - Only clear connector data if actually switching modes
   - Added `config.connector_id` and `config.endpoint_id` to dependency array

4. **Prevent unnecessary config updates**:
   ```javascript
   // Only update config state if node config is different
   if (JSON.stringify(nodeConfig) !== JSON.stringify(config)) {
     setConfig(nodeConfig);
   }
   ```

## Files Changed

1. `Frontend2/components/textflow/components/ConfigPanel.js` (lines 729-792)
2. `old-Frontend/components/textflow/components/ConfigPanel.js` (lines 608-671)

## Testing

To verify the fix works:

1. Open an HTTP node configuration
2. Click "Use Connector" button
3. Select a connector from the list
4. **Expected**: Mode should stay on "Connector" and show the selected connector
5. **Previously**: Mode would sometimes flicker back to "Traditional"

## Additional Improvements

- Added better logging to track mode switches
- Reduced unnecessary re-renders by checking if config actually changed
- More defensive checks to prevent mode flickering
