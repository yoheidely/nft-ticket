App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('NonFungibleTicket.json', function(data) {
      var NTFArtifact = data;
      App.contracts.NFT = TruffleContract(NTFArtifact);
      App.contracts.NFT.setProvider(App.web3Provider);
      App.getPrintedTickets();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.print-ticket-button', App.createTickets);
    $(document).on('click', '.btn-ticket-action', App.handleButtonClick);
  },

  handleButtonClick: function(event) {
    event.preventDefault();

    var actionType = $(event.target).attr('action-type');
    var ticketId = $(event.target).attr('ticket-id');
    var price = $(event.target).attr('price');
    var nftInstance;

    switch(actionType) {
      // user doesn't want to sell ticket anymore
      case 'cancel-sale':
        App.contracts.NFT.deployed().then(function(instance) {
          nftInstance = instance;
          return nftInstance.setSale(ticketId, false, {
            gas: 1000000,
            gasPrice: web3.toWei(2, 'gwei')
          });
        }).then(function(result) {
          console.log("successfully canceled sale");
        }).catch(function(err) {
          console.log("failed canceling sale");
          console.log(err.message);
        });
        break;

      // user toggles tickets status to 'sell' so other users can purchase
      case 'sell':
        App.contracts.NFT.deployed().then(function(instance) {
          nftInstance = instance;
          return nftInstance.setSale(ticketId, true, {
            gas: 1000000,
            gasPrice: web3.toWei(2, 'gwei')
          });
        }).then(function(result) {
          console.log("successfully put up for sale");
        }).catch(function(err) {
          console.log("failed putting up for sale");
          console.log(err.message);
        });
        break;

      // user purchases ticket from another user
      case 'purchase':
        App.contracts.NFT.deployed().then(function(instance) {
          nftInstance = instance;
          return nftInstance.takeOwnership(ticketId, {
            value: price,
            from: web3.eth.defaultAccount,
            gas: 1000000,
            gasPrice: web3.toWei(2, 'gwei')
          });
        }).then(function(result) {
          console.log("purchase successful");
        }).catch(function(err) {
          console.log("purchase failed");
          console.log(err.message);
        });
        break;

      default:
        break;
    }
  },

  getPrintedTickets: function() {
    var nftInstance;

    var ticketsRow = $('#ticketsRow');
    // var ticketTemplate = $('#ticketTemplate');

    App.contracts.NFT.deployed().then(function(instance) {
      nftInstance = instance;
      return nftInstance.getAllDeedIds.call();
    }).then(function(deedIds) {
      for (var index in deedIds) {
        var deedId = deedIds[index].toNumber();

        nftInstance.getTicketInformation(deedId).then(function(ticketInfo) {
          var ticketId = ticketInfo[0].toNumber();
          var ticketName = ticketInfo[1];
          var owner = ticketInfo[2];
          var price = ticketInfo[3].toNumber();
          var seat = ticketInfo[4].toNumber();
          var forSale = ticketInfo[5];

          var ticketTemplate = $('#ticketTemplate');
          ticketTemplate.find('.panel-title').text(ticketName);
          ticketTemplate.find('img').attr('src', 'images/ticket.jpg');
          ticketTemplate.find('.owner-address').text(owner);
          ticketTemplate.find('.ticket-price').text(web3.fromWei(price, 'ether'));
          ticketTemplate.find('.ticket-seat').text(seat);

          var btnElement = ticketTemplate.find('.btn-ticket-action');
          var text = '';
          var type = '';
          var buttonDisabled = false;

          if (owner === web3.eth.defaultAccount) {
            if (!forSale) {
              text = 'Sell';
              type = 'sell';
            } else {
              text = 'Cancel Sale';
              type = 'cancel-sale';
            }
          } else {
            if (!forSale) {
              text = 'Not for sale';
              type = 'not-for-sale';
              buttonDisabled = true;
            } else {
              text = 'Purchase';
              type = 'purchase';
            }
          }
          btnElement.text(text);
          btnElement.attr('action-type', type);
          btnElement.attr('price', price);
          btnElement.attr('ticket-id', ticketId);
          btnElement.attr('disabled', buttonDisabled);

          var panelElement = ticketTemplate.find('.panel-default');
          panelElement.removeClass();
          panelElement.addClass('panel');
          panelElement.addClass('panel-default');
          panelElement.addClass(type);

          ticketsRow.append(ticketTemplate.html());
        }).catch(function(err) {
          console.log("error getting ticket information");
          console.log(err.message);
        });
      }
    }).catch(function(err) {
      console.log("error getting ticket ids");
      console.log(err.message);
    });
  },

  createTickets: function(event) {
    event.preventDefault();

    if (!web3.eth.defaultAccount) {
      self.alert("please install/configure metamask");
      return;
    }
    var ntfInstance;

    App.contracts.NFT.deployed().then(function(instance) {
      ntfInstance = instance;
      return ntfInstance.printTickets(
        $('#printEventName').val(),
        web3.toWei($('#printPrice').val(), 'ether'),
        $('#printTicketNum').val(),
        {from: web3.eth.defaultAccount}
      );
    }).then(function(result) {
      console.log("successfully printed ticket");
      console.log(result);
    }).catch(function(err) {
      console.log("error printing ticket");
      console.log(err.meesage);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
