'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type:Sequelize.UUID,
         defaultValue:Sequelize.UUIDV4,
        allowNull:false,
        
      },
      to:{
        type: Sequelize.STRING,
        allowNull:false
      },
      from: {
        type:Sequelize.STRING,
        allowNull:false
      },
      content: {
        type:Sequelize.STRING,
        allowNull:false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Messages');
  }
};