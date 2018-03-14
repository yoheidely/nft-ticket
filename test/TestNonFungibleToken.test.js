import assertRevert from './helpers/assertRevert';

var NonFungibleTicket = artifacts.require("./NonFungibleTicket.sol");

contract('NonFungibleTicket',  accounts => {
    let nft = null;
    const _eventName = 'testEvent';
    const _eventName1 = 'testEvent1';
    const _price = 1;
    const _creator = accounts[0];
    const _userA = accounts[1];
    const _userB = accounts[2];
    const _userC = accounts[3];
    const _deed0 = 0;
    const _deed1 = 1;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        nft = await NonFungibleTicket.new({ from: _creator });
    });

    describe('NonFungibleTicket', function () {
        it('test creating ticket', async function () {
            await nft.createTicket(_eventName, _price, _userA);
            let owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);
            let ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[0], _deed0);
            assert.equal(ticketInfo[1], 'testEvent');
            assert.equal(ticketInfo[2], _userA);
            assert.equal(ticketInfo[3], _price);
            assert.equal(ticketInfo[4], 0);
            assert.equal(ticketInfo[5], true);
        });

        it('test create ticket for multiple users', async function () {
            await nft.createTicket(_eventName, _price, _userA);
            await nft.createTicket(_eventName, _price, _userB);

            let deeds = await nft.getAllDeedIds();
            assert.equal(deeds.length, 2);
            assert.equal(deeds[0], _deed0);
            assert.equal(deeds[1], _deed1);

            let ticketInfoA = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfoA[2], _userA);

            let ticketInfoB = await nft.getTicketInformation(_deed1);
            assert.equal(ticketInfoB[2], _userB);
        });

        it('testing take ownership success case', async function() {
            await nft.createTicket(_eventName, _price, _userA);
            let owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);

            nft.takeOwnership(_deed0, {from: _userB, value: _price});

            owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userB);

            // check ticket info
            let ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[2], _userB);
            assert.equal(ticketInfo[5], false);
        });

        it('testing take ownership fails because price too low', async function() {
            let validPrice = 3;
            await nft.createTicket(_eventName, validPrice, _userA);
            let owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);

            assertRevert(
                nft.takeOwnership(_deed0, {from: _userB, value: validPrice - 1})
            );

            owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);
        });

        it('testing take ownership fails because not for sale', async function() {
            await nft.createTicket(_eventName, _price, _userA);
            let owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);

            await nft.setSale(_deed0, false, {from: _userA});
            
            assertRevert(
                nft.takeOwnership(_deed0, {from: _userB, value: _price})
            );

            owner = await nft.ownerOf(_deed0);
            assert.equal(owner, _userA);
        });

        it('test creating multiple tickets for multiple events', async function() {
            await nft.createTicket(_eventName, _price, _userA);
            await nft.createTicket(_eventName1, _price, _userA);
            await nft.createTicket(_eventName, _price, _userB);
            await nft.createTicket(_eventName1, _price, _userB);
            await nft.createTicket(_eventName, _price, _userC);

            let ticketCount = await nft.countOfDeedsForEvent(_eventName);
            let ticketCount1 = await nft.countOfDeedsForEvent(_eventName1);
            assert.equal(ticketCount, 3);
            assert.equal(ticketCount1, 2);

            // check seat info
            let userBTicket1 = await nft.getTicketInformation(3);
            assert.equal(userBTicket1[1], 'testEvent1');
            assert.equal(userBTicket1[4], 1);
        });

        it('test toggling sale enabled status', async function() {
            await nft.createTicket(_eventName, _price, _userA);
            let ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[5], true);

            await nft.setSale(_deed0, false, {from: _userA});

            ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[5], false);

            await nft.setSale(_deed0, true, {from: _userA});

            ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[5], true);
        });

        it('test toggling sale enabled status fails if not owner', async function() {
            await nft.createTicket(_eventName, _price, _userA);
            let ticketInfo = await nft.getTicketInformation(_deed0);
            assert.equal(ticketInfo[5], true);

            assertRevert(nft.setSale(_deed0, false, {from: _userB}));
        })
    });
});
