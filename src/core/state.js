// Application global state and persistence
const STORAGE_KEY = 'netlab_suite_state_v1';

class AppState {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadState();
  }

  getDefaultState() {
    return {
      studentName: 'Студент',
      completedLabs: [],
      labScores: {},
      theme: 'dark'
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...this.getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved state:', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.saveState();
    this.notify();
  }

  setStudentName(name) {
    this.data.studentName = name.trim() || 'Студент';
    this.saveState();
    this.notify();
  }

  isLabCompleted(labId) {
    return this.data.completedLabs.includes(labId);
  }

  toggleLabCompleted(labId) {
    if (this.data.completedLabs.includes(labId)) {
      this.data.completedLabs = this.data.completedLabs.filter(id => id !== labId);
    } else {
      this.data.completedLabs.push(labId);
    }
    this.saveState();
    this.notify();
    return this.isLabCompleted(labId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.data);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }
}

export const state = new AppState();
