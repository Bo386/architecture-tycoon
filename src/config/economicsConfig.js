/**
 * Economics Configuration
 * 
 * Centralized configuration for all game economics including:
 * - Upgrade costs
 * - Server purchase costs
 * - Resource limits
 * - Starting budget
 */

export const ECONOMICS_CONFIG = {
    /**
     * Starting resources
     */
    starting: {
        money: 1500              // Initial budget at start of each level
    },

    /**
     * Initial values for server components
     */
    initialValues: {
        // Capacity (how many concurrent requests a component can handle)
        appServerCapacity: 10,
        databaseCapacity: 8,
        cacheCapacity: 15,
        loadBalancerCapacity: 50,
        cdnCapacity: 20,
        readReplicaCapacity: 8,
        
        // Processing delay (milliseconds to process each request)
        processingDelay: 300,
        databaseDelay: 400,
        cacheDelay: 100,
        loadBalancerDelay: 50,
        cdnDelay: 80,
        readReplicaDelay: 300
    },

    /**
     * Upgrade costs
     */
    upgrades: {
        server: 200,             // Cost to upgrade a server's capacity
        database: 300,           // Cost to upgrade database
        appServer: 300,          // Cost to upgrade app server
        cache: 250,              // Cost to upgrade cache
        loadBalancer: 200,       // Cost to upgrade load balancer
        cdn: 200                 // Cost to upgrade CDN
    },

    /**
     * Purchase costs for adding new servers
     */
    purchases: {
        database: 300,           // Cost to add a new database server
        appServer: 300,          // Cost to add a new app server
        loadBalancer: 300,       // Cost to add a load balancer
        cdn: 400,                // Cost to add a CDN
        readReplica: 350,        // Cost to add a read replica
        cache: 250               // Cost to add a cache server
    },

    /**
     * Maximum limits for server counts
     */
    limits: {
        databases: 5,            // Maximum number of database servers
        appServers: 5,           // Maximum number of app servers
        readReplicas: 3,         // Maximum number of read replicas
        caches: 3,               // Maximum number of cache servers
        loadBalancers: 1,        // Maximum number of load balancers (typically 1)
        cdns: 1                  // Maximum number of CDNs (typically 1)
    },

    /**
     * Capacity upgrade amounts
     */
    capacityIncrease: {
        server: 5,               // How much capacity increases per upgrade
        database: 3,             // Database capacity increase
        cache: 5,                // Cache capacity increase
        appServer: 5             // App server capacity increase
    },

    /**
     * Speed improvement per upgrade (percentage)
     */
    speedImprovement: {
        percentage: 0.2,         // 20% faster per upgrade
        minSpeed: 100            // Minimum speed (ms) - can't go below this
    }
};
