import { io } from 'socket.io-client';

/**
 * Collaborative Trip Planning Service
 * Enables real-time collaboration on trip planning with multiple users
 */

class CollaborationService {
  constructor() {
    this.socket = null;
    this.activeCollaborators = new Map();
    this.pendingInvitations = [];
  }

  /**
   * Initialize socket connection for collaboration
   */
  connect(tripId, userId) {
    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    this.socket.emit('join-trip', { tripId, userId });

    // Listen for collaborator events
    this.socket.on('collaborator-joined', (data) => {
      this.activeCollaborators.set(data.userId, data);
      this.notifyCollaboratorJoined(data);
    });

    this.socket.on('collaborator-left', (data) => {
      this.activeCollaborators.delete(data.userId);
      this.notifyCollaboratorLeft(data);
    });

    this.socket.on('trip-updated', (data) => {
      this.handleTripUpdate(data);
    });

    this.socket.on('cursor-moved', (data) => {
      this.handleCursorMove(data);
    });

    return this.socket;
  }

  /**
   * Disconnect from collaboration session
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeCollaborators.clear();
  }

  /**
   * Invite user to collaborate on trip
   */
  async inviteCollaborator(tripId, email, role = 'editor') {
    try {
      // This would call your API
      const response = await fetch(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, role })
     });

      if (!response.ok) throw new Error('Failed to invite collaborator');

      const invitation = await response.json();
      this.pendingInvitations.push(invitation);
      
      return invitation;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator from trip
   */
  async removeCollaborator(tripId, userId) {
    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove collaborator');

      this.activeCollaborators.delete(userId);
      
      // Notify via socket
      if (this.socket) {
        this.socket.emit('collaborator-removed', { tripId, userId });
      }

      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  /**
   * Update collaborator role/permissions
   */
  async updateCollaboratorRole(tripId, userId, newRole) {
    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');

      return await response.json();
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  /**
   * Broadcast trip update to all collaborators
   */
  broadcastUpdate(tripId, update, userId) {
    if (this.socket) {
      this.socket.emit('trip-update', {
        tripId,
        update,
        userId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send cursor position to other collaborators
   */
  sendCursorPosition(tripId, userId, position) {
    if (this.socket) {
      this.socket.emit('cursor-move', {
        tripId,
        userId,
        position,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get list of active collaborators
   */
  getActiveCollaborators() {
    return Array.from(this.activeCollaborators.values());
  }

  /**
   * Check user permissions
   */
  hasPermission(userId, permission) {
    const collaborator = this.activeCollaborators.get(userId);
    if (!collaborator) return false;

    const permissions = {
      owner: ['read', 'write', 'delete', 'invite', 'manage'],
      editor: ['read', 'write'],
      viewer: ['read']
    };

    return permissions[collaborator.role]?.includes(permission) || false;
  }

  /**
   * Get pending invitations
   */
  getPendingInvitations() {
    return this.pendingInvitations;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId) {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to accept invitation');

      this.pendingInvitations = this.pendingInvitations.filter(
        inv => inv._id !== invitationId
      );

      return await response.json();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Decline invitation
   */
  async declineInvitation(invitationId) {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to decline invitation');

      this.pendingInvitations = this.pendingInvitations.filter(
        inv => inv._id !== invitationId
      );

      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  /**
   * Event handlers
   */
  notifyCollaboratorJoined(collaborator) {
    console.log('Collaborator joined:', collaborator);
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('collaborator-joined', { detail: collaborator }));
  }

  notifyCollaboratorLeft(collaborator) {
    console.log('Collaborator left:', collaborator);
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('collaborator-left', { detail: collaborator }));
  }

  handleTripUpdate(update) {
    console.log('Trip updated:', update);
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('trip-updated', { detail: update }));
  }

  handleCursorMove(data) {
    // Trigger cursor animation
    window.dispatchEvent(new CustomEvent('cursor-moved', { detail: data }));
  }

  /**
   * Create a comment/note on the trip
   */
  async addComment(tripId, dayIndex, comment) {
    try {
      const response = await fetch(`/api/trips/${tripId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ dayIndex, comment })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const newComment = await response.json();

      // Broadcast to collaborators
      this.broadcastUpdate(tripId, {
        type: 'comment-added',
        comment: newComment
      });

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Vote on activity/destination
   */
  async voteOnItem(tripId, itemId, vote) {
    if (this.socket) {
      this.socket.emit('vote', {
        tripId,
        itemId,
        vote, // 'up' or 'down'
        timestamp: Date.now()
      });
    }
  }
}

const collaborationService = new CollaborationService();
export default collaborationService;
