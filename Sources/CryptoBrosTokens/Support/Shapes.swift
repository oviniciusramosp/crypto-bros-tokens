import SwiftUI

public extension RoundedRectangle {
    static func cb(_ r: CGFloat) -> RoundedRectangle { .init(cornerRadius: r, style: .continuous) }
}
public extension View {
    func cbCornerRadius(_ r: CGFloat) -> some View { clipShape(.rect(cornerRadius: r, style: .continuous)) }
}
