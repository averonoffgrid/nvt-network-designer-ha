# Test NVT Network Designer v0.2.0

1. Commission two ROOM_IO nodes, e.g. Node 1 and Node 2.
2. Create:
   `Node 1 / DI1 / NVT_SWITCH -> Node 2 / DO1 / NVT_SWITCH`
3. Click **Deploy**.
4. Observe:
   - Node 1 DI1 toggles false/true,
   - Node 2 DO1 follows the same value,
   - the binding edge becomes animated/thicker briefly when the source changes.
5. Add `Node 1 / TEMP -> Node 2 / SETPOINT`, Deploy again.
   The setpoint should follow the temperature.
6. One source may be bound to multiple subscribers.
7. Self-binding is also supported by the simulator.
