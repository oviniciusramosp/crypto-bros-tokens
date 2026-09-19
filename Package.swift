// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "CryptoBrosTokens",
    platforms: [.iOS(.v18)],
    products: [.library(name: "CryptoBrosTokens", targets: ["CryptoBrosTokens"])],
    targets: [.target(name: "CryptoBrosTokens", resources: [.copy("Resources/Fonts")])]
)
