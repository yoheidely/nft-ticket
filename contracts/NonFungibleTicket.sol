pragma solidity ^0.4.19;

import "./ERC721.sol";
import "./SafeMath.sol";
import "./PullPayment.sol";


contract NonFungibleTicket is ERC721 {

    function NonFungibleTicket() public {}

    using SafeMath for uint256;

    struct Ticket {
        uint256 deedId;
        bytes32 name;
        address owner;
        uint256 price;
        uint256 seat;
        uint256 created;
        uint256 deleted;
        bool forSale;
    }

    // method to create multiple tickets
    function printTickets(bytes32 _name, uint256 _price, uint256 _numTickets)
    external {
        for (uint256 i; i < _numTickets; i++) {
            createTicket(_name, _price, msg.sender);
        }
    }

    function createTicket(bytes32 _name, uint256 _price, address _owner)
    public {  // TODO restrict access to this function
        uint256 _deedId = totalDeeds;  // TODO race condition?
        require(_owner != address(0));
        require(deeds[_deedId].owner == address(0));

        totalDeeds = totalDeeds + 1;
        allDeeds.push(_deedId);
        deeds[_deedId] = Ticket({
            name: _name,
            owner: _owner,
            price: _price,
            created: now,
            deleted: 0,
            seat:  eventToDeeds[_name].length,
            deedId: _deedId,
            forSale: true
        });
        eventToDeeds[_name].push(_deedId);
    }
    
    // Total amount of deeds
    uint256 private totalDeeds;

    // Mapping from event Name to ID
    mapping (bytes32 => uint256[]) private eventToDeeds;

    // Mapping from deedId to Ticket
    mapping (uint256 => Ticket) private deeds;

    uint256[] private allDeeds;

    modifier onlyOwnerOf(uint256 _deedId) {
        require(deeds[_deedId].owner == msg.sender);
        _;
    }

    modifier purchasable(uint256 _deedId) {
        require(deeds[_deedId].forSale);
        _;
    }

    function ownerOf(uint256 _deedId)
    external view returns (address _owner) {
        _owner = deeds[_deedId].owner;
    }

    function getTicketInformation(uint256 _deedId)
    external view returns (uint256, string, address, uint256, uint256, bool) {
        return (
            deeds[_deedId].deedId,
            bytes32ToStr(deeds[_deedId].name),
            deeds[_deedId].owner,
            deeds[_deedId].price,
            deeds[_deedId].seat,
            deeds[_deedId].forSale
        );
    }

    function getAllDeedIds()
    external view returns (uint256[]) {
        return allDeeds;
    }

    function countOfDeeds()
    external view returns (uint256) {
        return totalDeeds;
    }

    function countOfDeedsForEvent(bytes32 _name)
    external view returns (uint256 _count) {
        _count = eventToDeeds[_name].length;
    }

    function setSale(uint256 _deedId, bool _saleEnabled)
    external onlyOwnerOf(_deedId) {
        deeds[_deedId].forSale = _saleEnabled;
    }

    function approve(address _to, uint256 _deedId)
    external payable {
    }

    function takeOwnership(uint256 _deedId)
    external payable purchasable(_deedId) {
        uint256 oldPrice = deeds[_deedId].price;
        uint256 newPrice = msg.value;
        address oldOwner = deeds[_deedId].owner;
        require(newPrice >= oldPrice);

        address _from = deeds[_deedId].owner;
        address _to = msg.sender;

        require(_to != address(0));
        require(_to != _from);

        deeds[_deedId].owner = _to;
        deeds[_deedId].forSale = false;

        oldOwner.transfer(newPrice);
    }

    function bytes32ToStr(bytes32 _bytes32) public pure returns (string){
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
