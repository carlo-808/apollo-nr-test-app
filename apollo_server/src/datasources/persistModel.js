'use strict'

const favroids = (sequelize, DataTypes) => {
  const Favroids = sequelize.define('Favroids', {
    name: DataTypes.STRING,
    roid_id: DataTypes.INTEGER,
    asteroiddata: DataTypes.JSON
  }, {
    tableName: 'favroids',
    timestamps: false
  })
  return Favroids
}

module.exports = favroids