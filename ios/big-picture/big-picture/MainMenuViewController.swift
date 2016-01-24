//
//  MainMenuViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class MainMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, UICollectionViewDataSource, UICollectionViewDelegate {
    
    var socketDelegate : SocketDelegate!
    var worksInProgress : [Picture]?
    var completedImages : [Picture]?
    var shouldScrollTableView : Bool! {
        didSet {
            if let tView = picturesTableView {
                tView.scrollEnabled = shouldScrollTableView
            }
        }
    }
    var backgroundSelectedButtonColor : UIColor!, backgroundDeselectedButtonColor : UIColor!
    var selectedCell : WorkInProgressTableViewCell?
    var lastTouchY : CGFloat?
    @IBOutlet var picturesTableView : UITableView!
    @IBOutlet var titleLabel : UILabel!
    @IBOutlet var worksInProgressButton : UIButton!
    @IBOutlet var completedWorksButton : UIButton!
    @IBOutlet var galleryCollectionView : UICollectionView!
    @IBOutlet var emptyAlertLabel : UILabel!
    
    override func viewDidLoad() {
        socketDelegate = SocketDelegate(url: SocketDelegate.urlBase, menuVC: self)
        backgroundSelectedButtonColor = worksInProgressButton.backgroundColor
        backgroundDeselectedButtonColor = completedWorksButton.backgroundColor
        shouldScrollTableView = true
        picturesTableView.canCancelContentTouches = false
        
        let layoutGuide = galleryCollectionView.collectionViewLayout as! UICollectionViewFlowLayout
        let spacing = CGFloat(10)
        layoutGuide.itemSize = CGSizeMake((self.view.frame.width - (20 + 20 + 10)) / 2, (self.view.frame.width - (20 + 20 + 10)) / 2 * 1.1)
    }
    
    @IBAction func beginPictureDrawing() {
        socketDelegate.askForImage { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let picVC = storyboard.instantiateViewControllerWithIdentifier("PictureDraw") as! PictureDrawViewController
            picVC.setPicture(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(picVC, animated: true)
        }
    }
    
    func goToViewWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForImageWithId(imageID) { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let imgVC = storyboard.instantiateViewControllerWithIdentifier("ImageProgress") as! ImageProgressViewController
            imgVC.setupImageProgressView(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(imgVC, animated: true)
        }
    }
    
    func goToContributeToWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForPictureWithId(imageID) { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let picVC = storyboard.instantiateViewControllerWithIdentifier("PictureDraw") as! PictureDrawViewController
            picVC.setPicture(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(picVC, animated: true)
        }
    }
    
    func changeDisplay(shouldShowWorkInProgress: Bool) {
        if (shouldShowWorkInProgress) {
            //display WIP
            worksInProgressButton.backgroundColor = backgroundSelectedButtonColor
            completedWorksButton.backgroundColor = backgroundDeselectedButtonColor
            galleryCollectionView.hidden = true
            picturesTableView.hidden = false
            titleLabel.text = "Works in Progress"
            if (worksInProgress?.count == 0) {
                emptyAlertLabel.text = "Nothing in progress!"
                emptyAlertLabel.hidden = false
            }
            else {
                emptyAlertLabel.hidden = true
            }
        }
        else {
            //display completed works
            worksInProgressButton.backgroundColor = backgroundDeselectedButtonColor
            completedWorksButton.backgroundColor = backgroundSelectedButtonColor
            galleryCollectionView.hidden = false
            picturesTableView.hidden = true
            titleLabel.text = "Gallery"
            if (completedImages?.count == 0) {
                emptyAlertLabel.text = "Nothing in the gallery!"
                emptyAlertLabel.hidden = false
            }
            else {
                emptyAlertLabel.hidden = true
            }
        }
    }
    
    @IBAction func changeDisplayedImagesFromSwipe(swipe: UISwipeGestureRecognizer) {
        changeDisplay(swipe.direction == UISwipeGestureRecognizerDirection.Left)
    }
    
    @IBAction func changeDisplayedImages(sender: UIButton) {
        changeDisplay(sender == worksInProgressButton)
    }
    
    func receivePictures(wip: [Picture], comp: [Picture]) {
        worksInProgress = wip
        completedImages = comp
        if (worksInProgress?.count == 0 && picturesTableView.hidden == false ||
            completedImages?.count == 0 && galleryCollectionView.hidden == false) {
            emptyAlertLabel.hidden = false
        }
        picturesTableView.reloadData()
        galleryCollectionView.reloadData()
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell : WorkInProgressTableViewCell = tableView.dequeueReusableCellWithIdentifier("workInProgress")! as! WorkInProgressTableViewCell
        if let workInProgress = worksInProgress?[indexPath.row] {
            cell.setupCell(workInProgress.colors, gestureTargetP: self, imageIDP: workInProgress.imageID, title: workInProgress.friendlyName!)
        }
        return cell
    }
    
    func tableView(tableView: UITableView, heightForRowAtIndexPath indexPath: NSIndexPath) -> CGFloat {
        return 140
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if (worksInProgress != nil) {
            return worksInProgress!.count
        }
        else {
            return 0
        }
        
    }
    
    func tableView(tableView: UITableView, shouldHighlightRowAtIndexPath indexPath: NSIndexPath) -> Bool {
        return false
    }
    
  /*  override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if let touch = touches.first {
            if let indexPath = picturesTableView.indexPathForRowAtPoint(touch.locationInView(picturesTableView)),
                    cell = (picturesTableView.cellForRowAtIndexPath(indexPath) as? WorkInProgressTableViewCell) {
                selectedCell = cell
                selectedCell!.initialTouchXVal = touch.locationInView(selectedCell).x
                lastTouchY = touch.locationInView(self.view).y
            }
        }
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if let touch = touches.first, cell = selectedCell, touchY = lastTouchY {
            cell.deltaX = max(cell.initialTouchXVal! - touch.locationInView(cell).x, 0)
            if (abs(touchY - touch.locationInView(self.view).y) < 3) {
                picturesTableView.scrollEnabled = false
            }
            if (cell.deltaX > 0) {
                cell.setNeedsDisplay()
            }
        }
    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {
        if let cell = selectedCell {
            if (cell.deltaX > 20) {
                cell.viewWorkInProgress()
                cell.deltaX = 0
                NSTimer.scheduledTimerWithTimeInterval(NSTimeInterval(0.2), target: cell, selector: "animateStripes:", userInfo: nil, repeats: false)
            }
        }
        picturesTableView.scrollEnabled = true
    }*/
    
    func collectionView(collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        if let len = completedImages?.count {
            return len
        }
        return 0
    }
    
    func collectionView(collectionView: UICollectionView, cellForItemAtIndexPath indexPath: NSIndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCellWithReuseIdentifier("CompletedWork", forIndexPath: indexPath) as! CompletedWorkCollectionViewCell
        if let picture = completedImages?[indexPath.row] {
            cell.setupCell(picture, title: picture.friendlyName!)
        }
        return cell
    }
    
    func collectionView(collectionView: UICollectionView, didSelectItemAtIndexPath indexPath: NSIndexPath) {
        if let cell = collectionView.cellForItemAtIndexPath(indexPath) as? CompletedWorkCollectionViewCell {
            goToViewWorkInProgressWithImageID(cell.imageID)
        }
    }
    
//    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
//        if (segue.identifier == "showPictureVCSegue") {
//            if let picture = sender as? Picture, vc = segue.destinationViewController as? PictureDrawViewController {
//                vc.setPicture(picture, sDelegate: self.socketDelegate)
//            }
//        }
//        else if (segue.identifier == "showPictureProgressSegue") {
//            if let picture = sender as? Picture, vc = segue.destinationViewController as? ImageProgressViewController {
//                vc.setupImageProgressView(picture, sDelegate: self.socketDelegate)
//            }
//        }
//    }
}
