import SwiftUI

public struct CBShadowStyle: Sendable {
    public struct Component: Sendable {
        public let color: (r: Double, g: Double, b: Double, a: Double)
        public let x: CGFloat
        public let y: CGFloat
        public let blur: CGFloat

        public init(color: (r: Double, g: Double, b: Double, a: Double), x: CGFloat, y: CGFloat, blur: CGFloat) {
            self.color = color
            self.x = x
            self.y = y
            self.blur = blur
        }
    }

    public let light: Component
    public let dark: Component

    public init(light: Component, dark: Component) {
        self.light = light
        self.dark = dark
    }
}
