/**
 * Tracks the current #session_id using the same gap rule as the Android SDK.
 * The id is a UUID v7 string. Its first 48 bits are the session start time in milliseconds.
 * A new id is assigned when the gap since the last event reaches the configured timeout.
 */

export var DEFAULT_SESSION_TIMEOUT = 5 * 60 * 1000;

var NO_SESSION = -1;

var HEX = '0123456789abcdef';

export var UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function normalizeSessionTimeout(timeoutMillis) {
    return (typeof timeoutMillis === 'number' && timeoutMillis > 0) ? timeoutMillis : DEFAULT_SESSION_TIMEOUT;
}

function randomBytes() {
    var bytes = new Array(16);
    var i;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        var random = new Uint8Array(16);
        crypto.getRandomValues(random);
        for (i = 0; i < 16; i++) {
            bytes[i] = random[i];
        }
        return bytes;
    }
    for (i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
}

function timestampByte(timestampMillis, shift) {
    return Math.floor(timestampMillis / Math.pow(2, shift)) % 256;
}

function formatUuid(bytes) {
    var chars = [];
    var i;
    for (i = 0; i < bytes.length; i++) {
        if (i === 4 || i === 6 || i === 8 || i === 10) {
            chars.push('-');
        }
        var value = bytes[i] & 0xff;
        chars.push(HEX.charAt(value >>> 4));
        chars.push(HEX.charAt(value & 0x0f));
    }
    return chars.join('');
}

/**
 * UUID v7 (time-ordered). The first 48 bits are timestampMillis.
 * @param {number} timestampMillis session start time in epoch milliseconds
 * @returns {string}
 */
export function generateUuidV7(timestampMillis) {
    var bytes = randomBytes();
    var shifts = [40, 32, 24, 16, 8, 0];
    var i;
    for (i = 0; i < shifts.length; i++) {
        bytes[i] = timestampByte(timestampMillis, shifts[i]);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatUuid(bytes);
}

export function uuidV7Timestamp(uuid) {
    return parseInt(String(uuid).replace(/-/g, '').substring(0, 12), 16);
}

function hasSession(sessionId) {
    return typeof sessionId === 'string' && sessionId.length > 0;
}

export function SessionManager(store) {
    this.store = store || null;
    this.sessionId = null;
    this.lastEventTime = NO_SESSION;
    if (!this.store) {
        return;
    }
    var storedId = this.store.loadSessionId();
    var storedTime = this.store.loadLastEventTime();
    if (hasSession(storedId) && typeof storedTime === 'number' && storedTime >= 0) {
        this.sessionId = storedId;
        this.lastEventTime = storedTime;
    }
}

/**
 * Assigns or extends the session for an event processed at now.
 * @param {number} now event processing time in epoch milliseconds
 * @param {number} timeoutMillis session timeout; values <= 0 use the 5 minute default
 * @returns {string} current session id
 */
SessionManager.prototype.onEvent = function (now, timeoutMillis) {
    var timeout = normalizeSessionTimeout(timeoutMillis);
    if (!hasSession(this.sessionId) || this.lastEventTime < 0 || now - this.lastEventTime >= timeout) {
        return this.startNewSession(now);
    }
    this.lastEventTime = now;
    this._persist();
    return this.sessionId;
};

/**
 * Starts a new session immediately, regardless of the current timeout window.
 * @param {number} now session start time in epoch milliseconds
 * @returns {string} the new session id
 */
SessionManager.prototype.startNewSession = function (now) {
    this.sessionId = generateUuidV7(now);
    this.lastEventTime = now;
    this._persist();
    return this.sessionId;
};

/**
 * Returns the current session without changing the last event time.
 * Page lifecycle changes alone must not extend a session.
 * @returns {string|null}
 */
SessionManager.prototype.onEnterBackground = function () {
    return this.sessionId;
};

/**
 * Starts the initial session, or returns the current session without changing
 * the last event time. Expiration is evaluated by the next event.
 * @param {number} now initial session start time in epoch milliseconds
 * @returns {string}
 */
SessionManager.prototype.onEnterForeground = function (now) {
    if (!hasSession(this.sessionId)) {
        return this.startNewSession(now);
    }
    return this.sessionId;
};

/**
 * @returns {string|null} current session id, or null when no session has started
 */
SessionManager.prototype.getSessionId = function () {
    return this.sessionId;
};

SessionManager.prototype._persist = function () {
    if (this.store) {
        this.store.save(this.sessionId, this.lastEventTime);
    }
};
