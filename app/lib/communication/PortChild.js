import EventEmitter from 'eventemitter3';
import Logger from '../logger';
import extensionizer from 'extensionizer';

const logger = new Logger('PortChild');

export default class PortChild extends EventEmitter {
    constructor(channelKey = false, eventHandler = false) {
        super();

        if(!channelKey)
            throw 'No communication channel provided';

        this._channelKey = channelKey;
        this._eventHandler = eventHandler;
        this._connected = false;

        this._connect();
    }

    _connect() {
        this._port = extensionizer.runtime.connect({ name: this._channelKey });
        this._connected = true;

        this._port.onMessage.addListener(({ action, data }) => {
            if(this._eventHandler)
                this._eventHandler.send(action, data);

            this.emit(action, data);
        });

        this._eventHandler && this._eventHandler.on('tunnel', ({ data }) => {
            this.send('tunnel', data);
        });

        this._port.onDisconnect.addListener(() => {
            logger.warn(`Lost connection to backgroundScript: ${extensionizer.runtime.lastError || 'No reason provided'}`);
            this._connected = false;
        });
    }

    send(action = false, data = {}) {
        if(!action)
            return { success: false, error: 'Function requires action {string} parameter' };

        if(!this._connected)
            return { success: false, error: 'Connection to backgroundScript failed' };

        this._port.postMessage({ action, data });
        return { success: true };
    }
}