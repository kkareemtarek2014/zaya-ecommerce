import { Star, ThumbsUp } from 'lucide-react';

export function ProductReviews() {
  const reviews = [
    {
      id: 1,
      name: 'Sarah M.',
      date: '2 months ago',
      rating: 5,
      comment: 'Absolutely love this piece! The quality is amazing and it looks exactly like the pictures. I got so many compliments wearing it to a wedding.',
      helpful: 12,
    },
    {
      id: 2,
      name: 'Nour T.',
      date: '3 weeks ago',
      rating: 4,
      comment: 'Beautiful design and very elegant. It arrived perfectly packaged too. My only small issue is that the clasp is a bit tricky to handle alone.',
      helpful: 5,
    },
    {
      id: 3,
      name: 'Amina S.',
      date: 'Just now',
      rating: 5,
      comment: 'Perfect gift for my sister. The delivery was super fast to Alex and the customer service was very helpful when I had a question.',
      helpful: 0,
    }
  ];

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-(family-name:--font-display) text-2xl font-semibold text-brand-primary">Customer Reviews</h2>
      
      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-4">
            <h3 className="text-5xl font-bold text-text-primary">4.8</h3>
            <div className="flex flex-col gap-1">
              <div className="flex text-brand-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-text-secondary">Based on 124 reviews</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((rating, i) => (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="w-2 font-medium">{rating}</span>
                <Star className="size-3 text-brand-accent fill-current" />
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-brand-blush">
                  <div 
                    className="h-full bg-brand-accent rounded-full" 
                    style={{ width: i === 0 ? '80%' : i === 1 ? '15%' : '5%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-8 pr-2">
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-text-primary">{review.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-brand-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < review.rating ? 'fill-current' : 'fill-transparent text-border-strong'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-text-muted">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-brand-primary">
                  <ThumbsUp className="size-3.5" />
                  Helpful ({review.helpful})
                            </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
