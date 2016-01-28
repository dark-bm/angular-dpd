"use strict";

var angularDpdSockets = [];

/* global angular */
angular.module('dpd', []).value('dpdConfig', [])
    .factory('dpdSocket', ['$rootScope', 'dpdConfig', function($rootScope, dpdConfig) {
        if (!dpdConfig.useSocketIo) {
            return {};
        }
        if (!io.connect) {
            throw ('angular-dpd: socket.io library not available, includ the client library or set dpdConfig.useSocketIo = false');
        }
        var serverRoot = dpdConfig.serverRoot || '';
        var socket = angularDpdSockets[serverRoot] = angularDpdSockets[serverRoot] || io.connect(serverRoot, dpdConfig.socketOpts);
        var listeners = {};
        return {
            on: function(eventName, callback) {
                listeners[callback] = function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                };
                socket.on(eventName, listeners[callback]);
            },
            emit: function(eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }, 
            removeListener: function(eventName, f){
                socket.removeListener(eventName, listeners[f]);
                delete listeners[f]
            },
            rawSocket: socket
        };
    }])
    .factory('dpd', ['$resource', '$rootScope', 'dpdConfig', 'dpdSocket', function($resource, $rootScope, dpdConfig, dpdSocket) {
        var dpd = {};
        dpd.socket = dpdSocket;
        if (angular.isArray(dpdConfig)) {
            dpdConfig = {
                collections: dpdConfig
            };
        }

        var serverRoot = (dpdConfig.serverRoot) ? dpdConfig.serverRoot.replace(/\/$/, "") : "";

        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function(fn, scope) {
                for (var i = 0, len = this.length; i < len; ++i) {
                    fn.call(scope, this[i], i, this);
                }
            }
        }

        dpdConfig.collections.forEach(function(d) {
            dpd[d] = $resource(serverRoot+'/'+d+'/:id');
        });

        dpd.on = function(scope, event, f) {
            if (!dpdSocket) return;
            dpdSocket.on(event, f);
            scope.$on("$destroy", function(){
                dpdSocket.removeListener(event, f);
            })
        };
        
        $rootScope.dpd = dpd;
        return dpd;
    }]);
