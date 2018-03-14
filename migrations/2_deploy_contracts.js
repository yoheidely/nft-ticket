var NonFungibleTicket = artifacts.require("NonFungibleTicket");

module.exports = function(deployer) {
  deployer.deploy(NonFungibleTicket);
};
