export const PROXY_ADMIN_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addressManager",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract AddressManager",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "changeProxyAdmin",
    inputs: [
      {
        name: "_proxy",
        type: "address",
        internalType: "address payable",
      },
      { name: "_newAdmin", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getProxyAdmin",
    inputs: [
      {
        name: "_proxy",
        type: "address",
        internalType: "address payable",
      },
    ],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProxyImplementation",
    inputs: [{ name: "_proxy", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "implementationName",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isUpgrading",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proxyType",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum ProxyAdmin.ProxyType",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAddress",
    inputs: [
      { name: "_name", type: "string", internalType: "string" },
      { name: "_address", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAddressManager",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "contract AddressManager",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setImplementationName",
    inputs: [
      { name: "_address", type: "address", internalType: "address" },
      { name: "_name", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setProxyType",
    inputs: [
      { name: "_address", type: "address", internalType: "address" },
      {
        name: "_type",
        type: "uint8",
        internalType: "enum ProxyAdmin.ProxyType",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setUpgrading",
    inputs: [{ name: "_upgrading", type: "bool", internalType: "bool" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "upgrade",
    inputs: [
      {
        name: "_proxy",
        type: "address",
        internalType: "address payable",
      },
      {
        name: "_implementation",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "upgradeAndCall",
    inputs: [
      {
        name: "_proxy",
        type: "address",
        internalType: "address payable",
      },
      {
        name: "_implementation",
        type: "address",
        internalType: "address",
      },
      { name: "_data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
];
