/**
 * Socket.io Real-Time Event Handler
 * Coordinates live incident broadcasts, provider dispatch pings, and room joining.
 */
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room for specific incident tracking
    socket.on('join_incident', (incidentId) => {
      socket.join(`incident_${incidentId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room incident_${incidentId}`);
    });

    // Join room for role-specific alerts
    socket.on('join_role_channel', (role) => {
      socket.join(`role_${role}`);
      console.log(`[Socket.io] Socket ${socket.id} subscribed to role_${role}`);
    });

    // Traveler emits emergency beacon
    socket.on('report_emergency', (incidentData) => {
      io.to('role_admin').emit('new_incident_alert', incidentData);
      io.to('role_provider').emit('new_incident_alert', incidentData);
    });

    // Provider or Admin status change broadcast
    socket.on('status_changed', ({ incidentId, newStatus, notes, timestamp }) => {
      io.to(`incident_${incidentId}`).emit('incident_updated', {
        incidentId,
        newStatus,
        notes,
        timestamp: timestamp || new Date(),
      });
      io.to('role_admin').emit('incident_updated', { incidentId, newStatus });
    });

    // Live provider GPS ping
    socket.on('provider_location_update', ({ incidentId, providerId, coordinates }) => {
      io.to(`incident_${incidentId}`).emit('provider_location_ping', {
        providerId,
        coordinates,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};
