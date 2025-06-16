// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // 导入 ERC721 标准合约
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol"; // 导入 ERC721 可枚举扩展
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // 导入 ERC721 URI 存储扩展
import "@openzeppelin/contracts/access/Ownable.sol"; // 导入 Ownable 合约，用于所有权控制
import "@openzeppelin/contracts/utils/Counters.sol"; // 导入 Counters 库，用于计数操作

contract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter; // 使用 Counters 库进行计数操作

    Counters.Counter public tokenIdCounter; // 用于跟踪令牌 ID 的计数器
    mapping(uint256 => uint256) public tokenPrices; // 用于存储令牌价格的映射

    // 添加 NFT 铸造事件
    event NFTMinted(uint256 indexed tokenId, string rarity, address indexed creator, address indexed owner);

    struct TokenInfo {
        string name;       // NFT 名称
        string description; // NFT 描述
        uint256 price;     // NFT 价格
        uint256 royalty;   // NFT 版税
        address creator;   // NFT 铸造者
        address owner;     // NFT 当前拥有者
        bool isListed;     // NFT 是否上架
        string rarity;     // NFT 稀有度
        uint256 timestamp; // 铸造时间戳
    }

    mapping(uint256 => TokenInfo) public tokenInfo; // 存储令牌信息的映射

    uint256 public constant DEFAULT_ROYALTY = 1000; // 默认版税比例为 10%

    // 构造函数，初始化合约并设置合约名称和代币符号
    constructor() ERC721("YourCollectible", "ETH") {
        // 不再需要设置默认版税
    }

    // 覆盖 _baseURI 函数，返回一个空字符串
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    // 铸造NFT并设置名称、描述、价格、数量、图片和时间戳
    function mintItem(
        address to,
        string memory name,
        string memory description,
        string memory uri, // IPFS 图片链接
        uint256 price,
        uint256 royalty
    ) public returns (uint256, string memory) {
        require(royalty <= 10000, "Royalty must be between 0 and 100%"); // 验证版税比例
        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // 如果铸造时未提供版税，则使用默认版税
        if (royalty == 0) {
            royalty = DEFAULT_ROYALTY; // 使用默认版税
        }

        // 随机生成稀有度
        string memory rarity = generateRandomRarity(tokenId);

        // 设置令牌信息，默认不在上架状态
        tokenInfo[tokenId] = TokenInfo({
            name: name,           // NFT 名称
            description: description, // NFT 描述
            price: price,         // NFT 价格
            royalty: royalty,     // NFT 版税
            creator: msg.sender,  // 铸造者
            owner: to,            // 初始拥有者为铸造者
            isListed: false,      // 默认不在上架状态
            rarity: rarity,       // 设置稀有度
            timestamp: block.timestamp // 铸造时间戳
        });

        // 触发 NFT 铸造事件
        emit NFTMinted(tokenId, rarity, msg.sender, to);

        return (tokenId, rarity); // 返回 tokenId 和稀有度
    }

    // 随机生成稀有度
    function generateRandomRarity(uint256 tokenId) internal view returns (string memory) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, tokenId))) % 100;

        if (random < 50) {
            return "Common"; // 50% 概率
        } else if (random < 80) {
            return "Rare"; // 30% 概率
        } else if (random < 95) {
            return "Epic"; // 15% 概率
        } else {
            return "Legendary"; // 5% 概率
        }
    }

    // 上架NFT
    function listItem(uint256 tokenId, uint256 price) public {
        require(tokenInfo[tokenId].owner == msg.sender, "You are not the owner"); // 确保调用者是所有者
        tokenInfo[tokenId].isListed = true; // 设置为上架状态
        tokenInfo[tokenId].price = price; // 设置出售价格
    }

    // 下架NFT
    function unlistItem(uint256 tokenId) public {
        require(tokenInfo[tokenId].owner == msg.sender, "You are not the owner"); // 确保调用者是所有者
        tokenInfo[tokenId].isListed = false; // 设置为下架状态
    }

    // Solidity要求的覆盖函数
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize); // 调用父类的 _beforeTokenTransfer
    }

    // 覆盖 _burn 函数
    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721) {
        super._burn(tokenId); // 调用父类的 _burn
    }

    // 覆盖 tokenURI 函数
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId); // 调用父类的 tokenURI
    }

    // 覆盖 supportsInterface 函数
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId); // 调用父类的 supportsInterface
    }

    // 购买方法
    function purchase(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token does not exist"); // 确保令牌存在
        require(tokenInfo[tokenId].isListed, "Token is not listed for sale"); // 确保令牌已上架
        require(msg.value == tokenInfo[tokenId].price, "Incorrect price"); // 确保发送的以太币数量与价格相符
        address from = tokenInfo[tokenId].owner; // 获取当前所有者地址

        // 计算版税
        uint256 royaltyAmount = (msg.value * tokenInfo[tokenId].royalty) / 10000; // 计算版税金额
        uint256 sellerAmount = msg.value - royaltyAmount; // 卖家获得的金额

        // 将版税转移给创作者
        payable(tokenInfo[tokenId].creator).transfer(royaltyAmount);
        // 将价格转移给卖家
        payable(from).transfer(sellerAmount);

        // 更新拥有者
        tokenInfo[tokenId].owner = msg.sender;
        tokenInfo[tokenId].isListed = false; // 购买后自动下架
        
        // 直接调用 _transfer 而不是 transferFrom
        _transfer(from, msg.sender, tokenId);

        emit Transfer(from, msg.sender, tokenId);
    }
}
