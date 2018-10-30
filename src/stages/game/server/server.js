/**
 * This represents the client side of stage 1.
 * 
 * The
 *  - commands,
 *  - and events
 * you define here will only be valid for the duration of the stage.
 */

// Export stage as the default export
export default {
  // Optionally define commands
  commands: {},

  // Optionally define events
  events: {},

  // Optionally define a setup method that is run before stage begins
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE',
      server.getCurrentStage())
  },  
  
  // Optionally define a teardown method that is run when stage finishes
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE',
      server.getCurrentStage())
  },

  // Configure options
  options: {
    // You can set duration if you want the stage to
    // be timed on the server.
    // duration: 10000
  }
}
