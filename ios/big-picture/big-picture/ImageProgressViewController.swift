//
//  PictureProgressViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class ImageProgressViewController: UIViewController, UIScrollViewDelegate {
    @IBOutlet var titleLabel : UILabel!
    @IBOutlet var imageProgressView : ImageProgressView!
    @IBOutlet var scrollView : UIScrollView!
    var currentImage : Picture!
    var socketDelegate : SocketDelegate!
    var pixelArrayHold : [[Int]]!
    var sViewWidthToHeightRatio : CGFloat = 1.0
    
    override func viewDidLoad() {
        var viewSize = CGSizeMake(0, 0)
        let imageWidthToHeightRatio = currentImage.rowsCols!.width / currentImage.rowsCols!.height
        let scrollViewWidthToHeightRatio = self.view.frame.width / (self.view.frame.height - titleLabel.frame.height)
        if (imageWidthToHeightRatio >= scrollViewWidthToHeightRatio) {
            viewSize.width = self.view.frame.width
            viewSize.height = viewSize.width * imageWidthToHeightRatio
        }
        else {
            viewSize.height = self.view.frame.height - titleLabel.frame.height
            viewSize.width = viewSize.width * currentImage.rowsCols!.width / currentImage.rowsCols!.height
        }
        sViewWidthToHeightRatio = scrollViewWidthToHeightRatio
        scrollView.contentSize = viewSize
        imageProgressView.frame = CGRectMake(0, 0, viewSize.width, viewSize.height)
        imageProgressView.setValues(currentImage.colors, dimension: CGSizeMake(currentImage.rowsCols!.width * CGFloat(currentImage.size), currentImage.rowsCols!.height * CGFloat(currentImage.size)), rowsCols: currentImage.rowsCols!, pArray: pixelArrayHold)
        
        titleLabel.text = currentImage.friendlyName
        
        imageProgressView.setNeedsDisplay()
    }
    
    func setupImageProgressView(picture: Picture, sDelegate: SocketDelegate) {
        currentImage = picture
        socketDelegate = sDelegate
        var pixelArray = [[Int]](count: (Int)(currentImage.dimensions!.height), repeatedValue:
        [Int](count: (Int)(currentImage.dimensions!.width), repeatedValue: -1))
        
       // let len = (Int)(currentImage.rowsCols!.width * currentImage.rowsCols!.height)
        let partitionSideLength = picture.size//(Int)(currentImage.dimensions!.width / currentImage.rowsCols!.width)
        for var i = 0; i < picture.pictures!.count; i++ {
            for var j = 0; j < partitionSideLength; j++ { //x
                for var k = 0; k < partitionSideLength; k++ { //y
                    pixelArray[k + picture.pictures![i].location!.y * partitionSideLength][j + picture.pictures![i].location!.x * partitionSideLength] = picture.pictures![i].pixelArrays![k][j]
                }
            }
        }
        pixelArrayHold = pixelArray
    }
    
    func updatePicture(pic: Picture) {
        
    }
    
    func viewForZoomingInScrollView(scrollView: UIScrollView) -> UIView? {
        return imageProgressView
    }
    
    func scrollViewDidZoom(scrollView: UIScrollView) {
        scrollView.contentSize.width = imageProgressView.frame.width
    }
    
    override func shouldAutorotate() -> Bool {
        return true
    }
    
    @IBAction func unwindToMainMenu() {
        self.navigationController?.popViewControllerAnimated(true)
    }
}
